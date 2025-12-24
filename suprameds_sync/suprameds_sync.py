import xmlrpc.client
import requests
import json

# ==========================================
# CONFIGURATION (EDIT THIS SECTION)
# ==========================================

# 1. Odoo Details (Where data comes FROM)
# If using Odoo Online: https://yourname.odoo.com
ODOO_URL = 'http://localhost:8069/' 
ODOO_DB = 'db'
ODOO_USERNAME = 'nikhilpnkr@gmail.com'
ODOO_PASSWORD = '82c5dffc3fbe07314b615d1a591b90a9ff44c0fb' # Go to Odoo -> Preferences -> Account Security -> New API Key

# 2. Medusa Details (Where data goes TO)
MEDUSA_URL = 'http://localhost:9000'
# If you have an API Token, paste it here. If not, leave empty and we try to login.
MEDUSA_API_TOKEN = 'sk_8414c9143e702889676394fa1d7e88fa021e981063de9635624fa2009912dc59' 
MEDUSA_ADMIN_EMAIL = 'admin@medusa-test.com'
MEDUSA_ADMIN_PASS = 'supersecret'

# ==========================================

def get_medusa_token():
    """Auto-login to get a token if one isn't provided"""
    if MEDUSA_API_TOKEN:
        return MEDUSA_API_TOKEN
    
    print("🔐 Logging into Medusa to get token...")
    login_url = f"{MEDUSA_URL}/admin/auth/token" # Medusa v1 path, v2 might differ
    # For Medusa v2/Standard, we often just use the API Key directly. 
    # Let's assume you generated a User API token from the dashboard for simplicity.
    print("⚠️ Please generate a 'User API Token' in Medusa Admin -> Settings -> API Keys and paste it in the config above.")
    return ""

def sync():
    print(f"🚀 Starting Sync: Odoo ({ODOO_URL}) -> Medusa ({MEDUSA_URL})")
    
    # 1. Connect to Odoo
    try:
        common = xmlrpc.client.ServerProxy(f'{ODOO_URL}/xmlrpc/2/common')
        uid = common.authenticate(ODOO_DB, ODOO_USERNAME, ODOO_PASSWORD, {})
        if not uid:
            print("❌ Odoo Authentication Failed! Check URL, DB, User, or API Key.")
            return
        print("✅ Connected to Odoo")
    except Exception as e:
        print(f"❌ Connection Error: {e}")
        return

    # 2. Get Products from Odoo
    models = xmlrpc.client.ServerProxy(f'{ODOO_URL}/xmlrpc/2/object')
    # Fetch products: Filter for 'Sold' items only
    product_ids = models.execute_kw(ODOO_DB, uid, ODOO_PASSWORD,
        'product.product', 'search',
        [[['sale_ok', '=', True]]])
    
    products = models.execute_kw(ODOO_DB, uid, ODOO_PASSWORD,
        'product.product', 'read',
        [product_ids], 
        {'fields': ['name', 'list_price', 'default_code', 'qty_available', 'description']})
    
    print(f"📦 Found {len(products)} products in Odoo.")

    # 3. Push to Medusa
    headers = {
        "Authorization": f"Bearer {MEDUSA_API_TOKEN}", 
        "Content-Type": "application/json"
    }
    
    # NOTE: If you don't have a token, this part will fail 401. 
    # Ensure you pasted the token in the config section.

    for p in products:
        # Prepare Medusa Payload
        medusa_payload = {
            "title": p['name'],
            "handle": p['name'].lower().replace(" ", "-").replace(".", ""),
            "description": str(p.get('description') or ""),
            "status": "published",
            "options": [{"title": "Size"}], # Dummy option required
            "variants": [{
                "title": "Standard",
                "sku": p['default_code'] or f"ODOO-{p['id']}",
                "inventory_quantity": int(p['qty_available']),
                "prices": [{
                    "amount": int(p['list_price'] * 100), # Convert to cents
                    "currency_code": "inr"
                }],
                "metadata": {"odoo_id": p['id']} # Link back to Odoo
            }]
        }

        # Send to Medusa
        # Check if product exists to update (PUT) or create (POST)
        # For simplicity, we are just trying to CREATE (POST) here.
        res = requests.post(f"{MEDUSA_URL}/admin/products", json=medusa_payload, headers=headers)
        
        if res.status_code == 200:
            print(f"✨ Created: {p['name']}")
        elif res.status_code == 401:
            print("❌ Error 401: Unauthorized. Your MEDUSA_API_TOKEN is invalid.")
            break
        else:
            print(f"⚠️ Could not create {p['name']}: {res.text}")

if __name__ == "__main__":
    sync()