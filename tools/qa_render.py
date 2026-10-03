"""Render check: verify the app actually paints content on key routes."""
import json, subprocess, sys, time, urllib.request, os, base64
sys.path.insert(0, '/tmp')
from cdp_shot import ws_connect, ws_send, ws_recv  # noqa

PORT = 8902
DIST = os.path.expanduser('~/workspace/spendly/dist')

SEED = {
    "onboarded": True,
    "user": {"name": "QA Tester", "email": "qa@example.com", "currency": "PKR", "theme": "light"},
    "transactions": [
        {"id": "t1", "type": "expense", "amount": 850, "title": "Lunch", "category": "Food",
         "date": "2026-10-03", "paymentMethod": "Cash", "notes": "", "receipt": None,
         "recurring": False, "createdAt": "2026-10-03T10:00:00.000Z", "nature": "variable"},
        {"id": "t2", "type": "expense", "amount": 25000, "title": "House Rent", "category": "Bills",
         "date": "2026-10-01", "paymentMethod": "Bank", "notes": "", "receipt": None,
         "recurring": True, "createdAt": "2026-10-01T10:00:00.000Z", "nature": "fixed"},
        {"id": "t3", "type": "income", "amount": 120000, "title": "Salary", "category": "Salary",
         "date": "2026-10-01", "paymentMethod": "Bank", "notes": "", "receipt": None,
         "recurring": False, "createdAt": "2026-10-01T10:00:00.000Z"},
    ],
    "budgets": [{"id": "b1", "category": "Food", "amount": 15000, "month": "2026-10", "period": "monthly"}],
    "goals": [{"id": "g1", "name": "Emergency fund", "targetAmount": 100000, "currentAmount": 25000,
               "targetDate": "2027-04-01",
               "contributions": [{"id": "c1", "amount": 25000, "date": "2026-09-01"}],
               "createdAt": "2026-09-01T10:00:00.000Z"}],
    "bills": [{"id": "bl1", "title": "House Rent", "amount": 25000, "category": "Bills",
               "frequency": "monthly", "dayOfMonth": 5, "nextDue": "2026-10-05", "notes": "",
               "createdAt": "2026-09-01T10:00:00.000Z", "history": []}],
    "selectedMonth": "2026-10",
}

server = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '--directory', DIST],
                          stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1)
chrome = subprocess.Popen(
    ['/opt/meta-chromium/chrome', '--headless=new', '--no-sandbox', '--disable-gpu',
     '--window-size=1440,900', '--remote-debugging-port=9334',
     '--user-data-dir=/tmp/chrome-qa2', 'about:blank'],
    stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(2)
try:
    tabs = json.loads(urllib.request.urlopen('http://127.0.0.1:9334/json/list').read().decode())
    page = [t for t in tabs if t['type'] == 'page'][0]
    s = ws_connect(page['webSocketDebuggerUrl'])
    mid = [0]
    def send(method, params=None):
        mid[0] += 1
        ws_send(s, {'id': mid[0], 'method': method, 'params': params or {}})
        return mid[0]
    def recv(mid_id, timeout=12):
        end = time.time() + timeout
        while time.time() < end:
            try:
                m = ws_recv(s, timeout=max(0.1, end - time.time()))
            except Exception:
                break
            d = m if isinstance(m, dict) else json.loads(m)
            if d.get('id') == mid_id:
                return d
        return {}
    def js(expr, timeout=12):
        r = recv(send('Runtime.evaluate', {'expression': expr, 'awaitPromise': True, 'returnByValue': True}), timeout)
        return ((r.get('result') or {}).get('result') or {}).get('value')

    js(f"location.href='http://127.0.0.1:{PORT}/'; 'go'")
    time.sleep(3)
    print('landing title:', js('document.title'))
    print('landing has hero:', js("document.body.innerText.includes('Take Control of')"))
    print('landing footer credit:', js("document.body.innerText.includes('Crafted by Asfund Ali')"))
    # seed BEFORE the app boots, then reload so the store hydrates from it
    js(f"localStorage.setItem('spendly:v1', {json.dumps(json.dumps(SEED))}); location.reload(); 'seed+reload'")
    time.sleep(4)
    print('after reload, on /app:', js("location.pathname"), '| has dashboard:',
          js("document.body.innerText.includes('Upcoming bills')"))
    for route, probes in [
        ('/app', ['Upcoming bills', 'Quick add', 'House Rent']),
        ('/app/bills', ['Bills', 'House Rent', 'Mark as paid', 'due in']),
        ('/app/advisor', ['Advisor', 'Smart tips', 'AI advice']),
        ('/app/goals', ['Emergency fund', 'Required', 'Pace', 'Projected']),
        ('/app/analytics', ['Spending heatmap', 'Heaviest', 'Fixed vs variable']),
        ('/app/budgets', ['Budgets', 'Food']),
        ('/app/settings', ['Google Sign-In', 'AI Advisor', 'Install App', 'Crafted by Asfund Ali']),
    ]:
        js(f"history.pushState({{}}, '', '{route}'); window.dispatchEvent(new PopStateEvent('popstate')); 1")
        time.sleep(2)
        text = js('document.body.innerText') or ''
        missing = [p for p in probes if p not in text]
        print(('OK  ' if not missing else 'MISS') + f' {route} ' + ('' if not missing else f'missing={missing}'))
    # dashboard screenshot
    js("history.pushState({}, '', '/app'); window.dispatchEvent(new PopStateEvent('popstate')); 1")
    time.sleep(2)
    r = recv(send('Page.captureScreenshot', {'format': 'png'}), 15)
    data = (r.get('result') or {}).get('data', '')
    if data:
        open('/tmp/qa_dashboard.png', 'wb').write(base64.b64decode(data))
        print('screenshot saved')
    else:
        print('no screenshot data')
finally:
    chrome.terminate(); server.terminate()
