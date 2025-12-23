=== payOS ===
Plugin Name: payOS
Contributors: diepmagik, locbt, hungndcasso, khanhnm
Tags: payos, vietqr, casso, woocommerce, payment
Requires at least: 4.7
Tested up to: 6.8
Stable tag: 1.0.73
Version: 1.0.73
Requires PHP: 7.0
License: GNU General Public License v3.0
License URI: https://www.gnu.org/licenses/gpl-3.0.html

Automatically generate a bank QR code for each order.

== Description ==

**payOS** is a powerful plugin that integrates the VietQR payment gateway into WooCommerce, allowing for "super-fast" payment processing. With payOS, a unique bank QR code is generated automatically for each order, streamlining the checkout process and improving customer satisfaction.

**Features:**
- Seamless integration with WooCommerce
- Automatic VietQR code generation for each order
- Faster checkout process with QR code payment
- Compatible with multiple Vietnamese banks
- Easy to set up and configure

== Dependency on Third-Party Services ==

This plugin relies on the integration with the **payOS** payment gateway as a third-party service to function correctly. This requires the transmission of certain data to and from the **payOS** service.

How the plugin uses **payOS**:

When an order is placed on your WooCommerce store, this plugin automatically generates a VietQR code by sending the relevant order information to the **payOS** service.
This QR code is then displayed to the customer to streamline the payment process.
Links:

- [payOS Merchant API](https://api-merchant.payos.vn)
- [payOS Checkout page](https://pay.payos.vn)
- [payOS Terms of use](https://payos.vn/thoa-thuan-su-dung/)
- [payOS Privacy policy](https://payos.vn/privacy-policy/)

By using this plugin, you agree to the terms and conditions of the payOS service, including their privacy policy. We strongly advise that you review both the terms of use and the privacy policy to ensure compliance with relevant legal requirements.

Please note that this usage is essential for the functionality of payOS. Full disclosure ensures transparency and allows users to make informed decisions regarding the use of this plugin and the transmission of their data.

== Installation ==

1. Upload the payOS plugin to your /wp-content/plugins/ directory, or install the plugin directly through the WordPress plugins screen.
2. Activate the plugin through the 'Plugins' screen in WordPress.
3. Navigate to WooCommerce -> Payment Methods settings and configure the payOS settings as needed.
4. Enjoy fast and secure payments with VietQR codes!

== Frequently Asked Questions ==

= How do I configure the plugin? = 
Go to the WooCommerce settings page and navigate to the Payment Methods tab. Here, you can configure the necessary settings for the plugin to work correctly with your WooCommerce store.

= Which banks are supported? = 
payOS supports a wide array of Vietnamese banks that are compatible with the VietQR system.

= Is there a test mode available? = 
Currently, payOS operates in live mode only. Future updates may include a sandbox environment for testing.

= What if a QR code is not generated for an order? = 
Ensure that your WooCommerce order statuses are correctly configured and that the plugin settings are properly set up. If problems persist, contact support for further assistance.

== Screenshots ==

1. payOS payment method in checkout page.
2. payOS QR code generated for an order.
3. payOS transfer information displayed in the order details.
4. Order payment status updated after successful payment.

== Changelog ==

= 1.0.0 =
* Initial release

= 1.0.1 =
* Fix: Removed unnecessary order status checks to streamline QR code generation.

= 1.0.2 = 
* Fix: Fixed some minor bugs.

= 1.0.3 = 
* Fix: Fixed some minor bugs.
* Update: Update some Vietnamese translations.

= 1.0.4 = 
* Fix: Fixed assets URL.

= 1.0.5 =
* Added: Add new status UNDERPAID for order.

= 1.0.6 =
* Added: Add option for refresh page after payment success.

= 1.0.7 =
* Update: Update assets.

== Upgrade Notice ==

= 1.0.1 =