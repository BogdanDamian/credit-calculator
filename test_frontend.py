from playwright.sync_api import sync_playwright
import os

def test_frontend():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(f"file://{os.getcwd()}/index.html")

        # Test basic flow to populate things
        page.fill('#amount', '100000')
        page.fill('#period', '10')
        page.select_option('#period-type', 'years')
        page.fill('#interest', '6.5')

        # Enable early repayment
        page.check('#enable-early-repayment')
        page.select_option('#repayment-type', 'recurring')
        page.fill('#extra-amount', '500')

        # Click calculate
        page.click('button[type="submit"]')

        # Wait for summary to show
        page.wait_for_selector('#savings-summary:visible')

        page.screenshot(path="verification/screenshots/early_repayment.png", full_page=True)

        browser.close()

if __name__ == '__main__':
    test_frontend()
