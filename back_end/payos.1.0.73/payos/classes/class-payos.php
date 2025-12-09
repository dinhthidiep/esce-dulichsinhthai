<?php
// phpcs:disable WordPress.Security.NonceVerification -- disable nonce warning

if (!defined('ABSPATH')) {
	exit; // Exit if accessed directly.
}

/**
 * payOS Transfer Payment Gateway.
 *
 * Provides a payOS Payment Gateway. Based on code by Mike Pepper.
 *
 * @class       WC_payOS_Payment_Gateway
 * @extends     WC_Payment_Gateway
 * @version     2.1.0
 * @package     WooCommerce\Classes\Payment
 */
class WC_payOS_Payment_Gateway extends WC_Payment_Gateway
{

	/**
	 * Array of locales
	 *
	 * @var array
	 */
	public $locale;

	/**
	 * PayOS gateway settings
	 * 
	 * @var array 
	 */
	public $payos_gateway_settings;

	public $message;

	public $instructions;

	/**
	 * Constructor for the gateway.
	 */
	const PAYOS_URL_MERCHANT_API = "https://api-merchant.payos.vn";
	static private $PAYOS_CHECKOUT_HOST = "https://pay.payos.vn";
	static private $PAYOS_URL_CREATE_PAYMENT_LINK = self::PAYOS_URL_MERCHANT_API . "/v2/payment-requests";
	static private $PAYOS_URL_CONFIRM_WEBHOOK = self::PAYOS_URL_MERCHANT_API . "/confirm-webhook";
	static private $URL_GET_PAYMENT_LINK_INFO = self::PAYOS_URL_MERCHANT_API . "/v2/payment-requests/";
	static private $PAYOS_SUCCESS = "00";
	static private $PAYOS_NOT_FOUND_ORDER_CODE = 101;
	static private $PAYOS_ORDER_EXIST = 231;
	static private $PAYOS_WEBHOOK_ENDPOINT = "verify_payos_webhook";
	static public $payos_default_settings = array(
		'use_payment_gateway'         => 'yes',
		'client_id' => '',
		'api_key' => '',
		'checksum_key' => '',
		'order_status' => array(
			'order_status_after_paid'   => 'wc-processing',
			'order_status_after_underpaid' => 'wc-underpaid',
			'order_status_after_failed' => 'wc-failed',
		),
		'transaction_prefix' => 'DH',
		'link_webhook' => 'no',
		'gateway_info' => array(
			'name' => '',
			'account_number' => '',
			'account_name' => '',
			'bank_name' => ''
		),
		'refresh_upon_successful_payment' => 'no'
	);
	static private $PAYOS_BLACK_LIST_PREFIX = array("FT", "TF", "TT", "VQR");
	public function __construct()
	{
		$this->id                 = 'payos';
		$this->has_fields         = false;
		$this->icon               = apply_filters('woocommerce_icon_payos', PAYOS_GATEWAY_URL . '/assets/img/payos_crop.png');
		$this->method_title       = __('Payment by bank transfer (Scan VietQR)', 'payos');
		$this->method_description = __('Take payments by scanning QR code with Vietnamese banking App. Supported by most major banks in Vietnam', 'payos');

		$this->message = '';

		// Load the settings.
		$this->init_form_fields();
		$this->init_settings();

		// Define user set variables.
		$this->title        = $this->get_option('title');
		$this->description  = $this->get_option('description');

		// payOS account fields shown on the thanks page and in emails.
		$this->payos_gateway_settings = $this->payos_get_gateway_settings();

		if (isset($_REQUEST['payos_gateway_settings']) && isset($_REQUEST['submit'])) {
			$this->payos_save_settings_and_webhook();
		}

		add_action('woocommerce_update_options_payment_gateways_' . $this->id, array($this, 'process_admin_options'));
		add_action('woocommerce_update_options_payment_gateways_' . $this->id, array($this, 'payos_save_settings_and_reset_webhook'));
		add_action('woocommerce_thankyou_' . $this->id, array($this, 'payos_thankyou_page'), 5);
		// Customer Emails.
		add_action('woocommerce_email_before_order_table', array($this, 'email_instructions'), 10, 3);
		// Customize Order Button
		add_action('woocommerce_after_checkout_validation', array($this, 'payos_check_gateway_settings'), 10, 2);

		add_action('woocommerce_api_' . self::$PAYOS_WEBHOOK_ENDPOINT, array($this, 'payos_verify_payment_handler'));
		add_action('admin_notices', array($this, 'payos_notice_checkout'));

		// custom thankyou text
		add_filter('woocommerce_thankyou_order_received_text', array($this, 'payos_order_received_text'), 10, 2);
		// Custom checkout ui
		add_shortcode('payos_checkout', array($this, 'payos_checkout_shortcode'));
		add_action('admin_enqueue_scripts', array($this, 'payos_enqueue_admin_script'));
	}

	public function payos_notice_checkout()
	{
		$payos_gateway_settings = $this->payos_get_gateway_settings();
		if (
			!isset($payos_gateway_settings['client_id']) || strlen($payos_gateway_settings['client_id']) == 0
			|| !isset($payos_gateway_settings['api_key']) || strlen($payos_gateway_settings['api_key']) == 0
			|| !isset($payos_gateway_settings['checksum_key']) || strlen($payos_gateway_settings['checksum_key']) == 0
		) {
			echo '<div class="notice notice-warning">
					<p>' . esc_html__('payOS has not been set up yet!', 'payos') . '</p>
				</div>';
		}
	}

	public function payos_check_gateway_settings($data, $error)
	{
		if ($data['payment_method'] === $this->id) {
			$payos_gateway_settings = $this->payos_get_gateway_settings();
			if (
				!isset($payos_gateway_settings['client_id']) || strlen($payos_gateway_settings['client_id']) == 0
				|| !isset($payos_gateway_settings['api_key']) || strlen($payos_gateway_settings['api_key']) == 0
				|| !isset($payos_gateway_settings['checksum_key']) || strlen($payos_gateway_settings['checksum_key']) == 0
			) {
				wc_add_notice(__('payOS has not been set up by the administrator. Please contact the system administrator.', 'payos'), 'error');
			}
		}
	}

	function payos_sanitize_recursive($data)
	{
		if (is_array($data)) {
			return array_map(array($this, 'payos_sanitize_recursive'), $data);
		} else {
			return sanitize_text_field($data);
		}
	}

	public function payos_save_settings_and_webhook()
	{
		if (is_array($_REQUEST['payos_gateway_settings'])) {
			// Sanitize each field in the payos_gateway_settings array
			$sanitized_settings = $this->payos_sanitize_recursive($_REQUEST['payos_gateway_settings']);

			$create_webhook = $this->payos_create_webhook($sanitized_settings);
			if ($create_webhook) {
				$gateway_info = json_decode($create_webhook, true);
				$this->payos_update_gateway_settings("yes", $gateway_info, $sanitized_settings);

				$this->message = '<div class="updated notice"><p><strong>' .
					esc_html__('Successful webhook registration', 'payos') .
					'</p></strong></div>';
			} else {
				$this->payos_update_gateway_settings("no", self::$payos_default_settings['gateway_info']);

				$this->message =
					'<div class="error notice"><p><strong>' .
					esc_html__('Webhook creation failed', 'payos') .
					'</p></strong></div>';
			}
			// Message for use
			$this->message .=
				'<div class="updated notice"><p><strong>' .
				esc_html__('Settings saved', 'payos') .
				'</p></strong></div>';
		} else {
			$this->payos_update_gateway_settings("no", self::$payos_default_settings['gateway_info']);
			$this->message =
				'<div class="error notice"><p><strong>' .
				esc_html__('Can not save settings! Please refresh this page.', 'payos') .
				'</p></strong></div>';
		}
	}

	public function payos_update_gateway_settings($webhook_status, $gateway_info, $gateway_settings = null)
	{
		if ($webhook_status == 'no') {
			$this->payos_gateway_settings['gateway_info'] = $gateway_info;
		} else {
			$this->payos_gateway_settings = array_merge($this->payos_gateway_settings, $gateway_settings);
			$this->payos_gateway_settings['gateway_info']['account_name'] = $gateway_info['data']['accountName'];
			$this->payos_gateway_settings['gateway_info']['account_number'] = $gateway_info['data']['accountNumber'];
			$this->payos_gateway_settings['gateway_info']['name'] = $gateway_info['data']['name'];
			$this->payos_gateway_settings['gateway_info']['bank_name'] = $gateway_info['data']['shortName'];
		}
		$this->payos_gateway_settings['link_webhook'] = $webhook_status;
		update_option("payos_gateway_settings", $this->payos_gateway_settings);
	}

	static function payos_get_gateway_settings()
	{
		$payos_settings = get_option('payos_gateway_settings', self::$payos_default_settings);
		$payos_settings = wp_parse_args($payos_settings, self::$payos_default_settings);
		return $payos_settings;
	}

	public function payos_save_settings_and_reset_webhook()
	{
		if (isset($_REQUEST['payos_gateway_settings']) && is_array($_REQUEST['payos_gateway_settings'])) {
			// Sanitize each field
			$client_id = isset($_REQUEST['payos_gateway_settings']['client_id']) ? sanitize_text_field($_REQUEST['payos_gateway_settings']['client_id']) : '';
			$api_key = isset($_REQUEST['payos_gateway_settings']['api_key']) ? sanitize_text_field($_REQUEST['payos_gateway_settings']['api_key']) : '';
			$checksum_key = isset($_REQUEST['payos_gateway_settings']['checksum_key']) ? sanitize_text_field($_REQUEST['payos_gateway_settings']['checksum_key']) : '';
			$transaction_prefix = isset($_REQUEST['payos_gateway_settings']['transaction_prefix']) ? sanitize_text_field($_REQUEST['payos_gateway_settings']['transaction_prefix']) : '';
			$refresh_upon_successful_payment = isset($_REQUEST['payos_gateway_settings']['refresh_upon_successful_payment']) ? $_REQUEST['payos_gateway_settings']['refresh_upon_successful_payment'] : 'no';

			if (
				$client_id != $this->payos_gateway_settings['client_id']
				|| $api_key != $this->payos_gateway_settings['api_key']
				|| $checksum_key != $this->payos_gateway_settings['checksum_key']
			) {
				$_REQUEST['payos_gateway_settings']['link_webhook'] = 'no';
			}

			// Sanitize and validate transaction prefix
			$transaction_prefix = preg_replace('/[^a-zA-Z0-9]/', '', $transaction_prefix);

			if (strlen($transaction_prefix) > 3) {
				$transaction_prefix = substr($transaction_prefix, 0, 3);
			}

			if (in_array($transaction_prefix, self::$PAYOS_BLACK_LIST_PREFIX)) {
				$transaction_prefix = self::$payos_default_settings["transaction_prefix"];
			}

			// Update sanitized transaction prefix
			$_REQUEST['payos_gateway_settings']['transaction_prefix'] = $transaction_prefix;

			// Update sanitized order status
			$sanitized_order_status = $this->payos_sanitize_recursive($_REQUEST['payos_gateway_settings']['order_status']);

			// Update the option with sanitized data
			update_option('payos_gateway_settings', array(
				'client_id' => $client_id,
				'api_key' => $api_key,
				'checksum_key' => $checksum_key,
				'transaction_prefix' => $transaction_prefix,
				'order_status' => $sanitized_order_status,
				'order_status' => $sanitized_order_status,
				'link_webhook' => isset($_REQUEST['payos_gateway_settings']['link_webhook']) ? sanitize_text_field($_REQUEST['payos_gateway_settings']['link_webhook']) : 'no',
				'refresh_upon_successful_payment' => $refresh_upon_successful_payment
			));
		}
	}

	/**
	 * Initialize Gateway Settings Form Fields. 
	 * 
	 */
	public function init_form_fields()
	{
		$this->form_fields = array(
			'enabled'         => array(
				'title'   => __('Enable/Disable', 'payos'),
				'type'    => 'checkbox',
				'label'   => __('Enable bank transfer', 'payos'),
				'default' => 'true',
			),
			'title'           => array(
				'title'       => __('Title', 'payos'),
				'type'        => 'text',
				'description' => __('This controls the title which the user sees during checkout.', 'payos'),
				'default'     => __('Payment by bank transfer (Scan VietQR)', 'payos'),
				'desc_tip'    => true,
			),
			'description'     => array(
				'title'       => __('Description', 'payos'),
				'type'        => 'textarea',
				'description' => __('Payment method description that the customer will see on your checkout.', 'payos'),
				'default'     => __('Pay for orders via payOS. Supported by almost Vietnamese banking apps', 'payos'),
				'desc_tip'    => true,
			),
			'payos_gateway_settings' => array(
				'type' => 'payos_gateway_settings',
			)
		);
	}

	public function payos_enqueue_admin_script()
	{
		wp_enqueue_script('payos-select2-script', PAYOS_GATEWAY_URL . '/assets/js/select2.min.js', array(), false, true);
		wp_register_script('payos-admin-script', PAYOS_GATEWAY_URL . '/assets/js/payos-admin.js', array('jquery'), false, true);
		$payos_admin_data = array(
			'show_less' => __('Show less', 'payos'),
			'connect_status' => $this->payos_gateway_settings['link_webhook'] == 'no' ? __('No Connection', 'payos') : __('Connected', 'payos'),
			'hide' => __('Hide', 'payos'),
			'show' => __('Show', 'payos')
		);
		wp_localize_script('payos-admin-script', 'payos_data', $payos_admin_data);
		wp_enqueue_script('payos-admin-script');
		wp_enqueue_style('payos-select2-styles', PAYOS_GATEWAY_URL . '/assets/css/select2.min.css', array(), false, 'all');
		wp_enqueue_style('payos-custom-styles', PAYOS_GATEWAY_URL . '/assets/css/payos-admin.css', array(), false, 'all');
		// Verify the media type because when load use admin_enqueue_scripts, it set media to '1'
		global $wp_styles;
		if (isset($wp_styles->registered['payos-select2-styles']) && $wp_styles->registered['payos-select2-styles']->args !== 'all') {
			$wp_styles->registered['payos-select2-styles']->args = 'all';
		}
		if (isset($wp_styles->registered['payos-custom-styles']) && $wp_styles->registered['payos-custom-styles']->args !== 'all') {
			$wp_styles->registered['payos-custom-styles']->args = 'all';
		}
	}
	/**
	 * Generate account details html.
	 *
	 * @return string
	 */
	public function generate_payos_gateway_settings_html()
	{
		ob_start();
		$allowed_html_tags = [
			'tr' => ['id' => []],
			'th' => ['scope' => []],
			'td' => ['class' => [], 'id' => []],
			'tbody' => ['id' => []],
			'button' => [
				'id' => [],
				'onclick' => [],
				'type' => [],
				'class' => []
			],
			'div' => ['id' => [], 'class' => []],
			'ul' => [],
			'li' => [],
			'b' => [],
			'input' => [
				'type' => [],
				'name' => [],
				'value' => [],
				'id' => [],
				'onclick' => [],
				'class' => [],
				'checked' => []
			],
			'select' => [
				'name' => [],
				'id' => []
			],
			'option' => [
				'value' => [],
				'selected' => []
			],
			'label' => [
				'for' => [],
				'id' => []
			],
			'a' => [
				'id' => [],
				'href' => [],
				'onclick' => [],
				'onkeypress' => []
			],
			'br' => []
		];
		echo wp_kses_post($this->message);
		echo wp_kses('<input type="hidden" id="action" name="action" value="payos_save_settings">
		<input type="hidden" id="payos_nonce" name="payos_nonce" value="' . esc_attr(wp_create_nonce('payos_save_settings')) . '">', $allowed_html_tags);
		if ($this->payos_gateway_settings['use_payment_gateway'] == 'yes') {

			$payment_gateway_config = '
			<tr>
				<th scope="row">' . esc_html(__('Connection Information', 'payos')) . '</th>
				<td class="forminp" id="payos_gateway_settings">
					<button id="payos_info_button" onclick="showDetailGateway()" type="button" class="' . ($this->payos_gateway_settings['link_webhook'] == 'no' ? 'no-connection' : 'connected') . '">';

			if ($this->payos_gateway_settings['link_webhook'] == 'no') {
				$payment_gateway_config .= esc_html(__('No Connection', 'payos')) . '</button>';
			} else {
				$payment_gateway_config .= esc_html(__('Connected', 'payos')) . '</button>
					<div id="payos_gateway_info">
						<ul>
							<li><b>' . esc_html(__('Gateway name', 'payos')) . ': </b>' . esc_html($this->payos_gateway_settings['gateway_info']['name']) . '</li>
							<li><b>' . esc_html(__('Account number', 'payos')) . ': </b>' . esc_html($this->payos_gateway_settings['gateway_info']['account_number']) . '</li>
							<li><b>' . esc_html(__('Account name', 'payos')) . ': </b>' . esc_html($this->payos_gateway_settings['gateway_info']['account_name']) . '</li>    
							<li><b>' . esc_html(__('Bank', 'payos')) . ': </b>' . esc_html($this->payos_gateway_settings['gateway_info']['bank_name']) . '</li>    
						</ul>
					</div>';
			}

			$payment_gateway_config .= '
					<input type="text" name="payos_gateway_settings[link_webhook]" value="' . esc_attr($this->payos_gateway_settings['link_webhook']) . '" />
					<br>
					<button id="toggle_payos_gateway_settings" onClick="togglePayOSSetting(event)">' . esc_html(__('Enter information of payOS', 'payos')) . '</button>
				</td>
			</tr>
			<tbody id="payos_gateway_settings_group">
				<tr valign="top">
					<th scope="row" class="titledesc">' . esc_html(__('Client ID', 'payos')) . ':</th>
					<td class="forminp" id="payos_gateway_settings">
						<input type="password" value="' . esc_attr($this->payos_gateway_settings['client_id']) . '" name="payos_gateway_settings[client_id]" id="payos_client_id" />
						<input id="show_client_id" onclick="showClientId()" type="button" class="button-show" value="' . esc_attr(__('Show', 'payos')) . '" />
					</td>
				</tr>
				<tr valign="top">
					<th scope="row" class="titledesc">' . esc_html(__('API Key', 'payos')) . ':</th>
					<td class="forminp" id="payos_gateway_settings">
						<input type="password" value="' . esc_attr($this->payos_gateway_settings['api_key']) . '" name="payos_gateway_settings[api_key]" id="payos_api_key" />
						<input id="show_api_key" onclick="showApiKey()" type="button" class="button-show" value="' . esc_attr(__('Show', 'payos')) . '" />
					</td>
				</tr>
				<tr valign="top">
					<th scope="row" class="titledesc">' . esc_html(__('Checksum Key', 'payos')) . ':</th>
					<td class="forminp" id="payos_gateway_settings">
						<input type="password" value="' . esc_attr($this->payos_gateway_settings['checksum_key']) . '" name="payos_gateway_settings[checksum_key]" id="payos_checksum_key" />
						<input id="show_checksum_key" onclick="showChecksumKey()" type="button" class="button-show" value="' . esc_attr(__('Show', 'payos')) . '" />
						<br>
						<div class="submit-container">
							<input type="submit" name="submit" id="submit" class="button-primary" value="' . esc_attr(__('Check connection payOS', 'payos')) . '" />
							<a id="instructions_link" href="https://payos.vn/docs/huong-dan-su-dung/tao-kenh-thanh-toan/" onclick="window.open(this.href); return false;" onkeypress="window.open(this.href); return false;">' . esc_html(__('Instructions to get Client ID and API Key', 'payos')) . '</a>
						</div>
					</td>
				</tr>
			</tbody>
			<tr>
				<th scope="row">' . esc_html(__('Prefix:', 'payos')) . '</th>
				<td id="payos_gateway_settings">
					<input name="payos_gateway_settings[transaction_prefix]" type="text" value="' . esc_attr($this->payos_gateway_settings['transaction_prefix']) . '" id="transaction_prefix" />
					<label id="transaction_prefix" for="transaction_prefix">' . esc_html(__('Maximum 3 characters, no spaces and no special characters. If contained, it will be deleted. Please do not prefix starting with FT, TF, TT, VQR', 'payos')) . '</label>
				</td>
			</tr>
			<tr>
				<th scope="row">' . esc_html(__('Status if payment is successful:', 'payos')) . '</th>
				<td id="payos_gateway_settings">
					<select name="payos_gateway_settings[order_status][order_status_after_paid]" id="order_status_after_paid">';

			foreach ($this->payos_get_order_statuses_after_paid() as $key => $value) {
				$payment_gateway_config .= '<option value="' . esc_attr($key) . '" ' . selected($key, $this->payos_gateway_settings["order_status"]["order_status_after_paid"], false) . '>' . esc_html($value) . '</option>';
			}

			$payment_gateway_config .= '</select>
				</td>
			</tr>
			<tr>
				<th scope="row">' . esc_html(__('Status if payment is underpaid:', 'payos')) . '</th>
				<td id="payos_gateway_settings">
					<select name="payos_gateway_settings[order_status][order_status_after_underpaid]" id="order_status_after_underpaid">';

			foreach ($this->payos_get_order_statuses_after_underpaid() as $key => $value) {
				$payment_gateway_config .= '<option value="' . esc_attr($key) . '" ' . selected($key, $this->payos_gateway_settings['order_status']['order_status_after_underpaid'], false) . '>' . esc_html($value) . '</option>';
			}

			$payment_gateway_config .= '</select>
				</td>
			</tr>
			<tr>
				<th scope="row">' . esc_html(__('Status if payment is failed:', 'payos')) . '</th>
				<td id="payos_gateway_settings">
					<select name="payos_gateway_settings[order_status][order_status_after_failed]" id="order_status_after_failed">';

			foreach ($this->payos_get_order_statuses_after_failed() as $key => $value) {
				$payment_gateway_config .= '<option value="' . esc_attr($key) . '" ' . selected($key, $this->payos_gateway_settings['order_status']['order_status_after_failed'], false) . '>' . esc_html($value) . '</option>';
			}

			$payment_gateway_config .= '</select>
				</td>
			</tr>';

			$payment_gateway_config .= '<tr id="payos_gateway_settings_refresh" valign="top">
				<th scope="row">' . esc_html(__('Enable refresh upon successful payment:', 'payos')) . '</th>
				<td id="payos_gateway_settings">
					<input name="payos_gateway_settings[refresh_upon_successful_payment]" type="hidden" value="no">
					<input name="payos_gateway_settings[refresh_upon_successful_payment]" type="checkbox" value="yes" id="refresh" ' . checked($this->payos_gateway_settings['refresh_upon_successful_payment'], 'yes', false) . ' />
					<label for="payos_gateway_settings[refresh_upon_successful_payment]">' . esc_html(__('Enable', 'payos')) . '</label>
				</td>
			</tr>';

			echo wp_kses($payment_gateway_config, $allowed_html_tags);
		}
		return ob_get_clean();
	}

	public function payos_checkout_shortcode($attributes)
	{
		// Define your data
		$payos_data = array(
			'message' => __('Please wait...', 'payos'),
			'error_message' => __('Cannot show payment link', 'payos'),
			'icon' =>  PAYOS_GATEWAY_URL . '/assets/img/failed.png',
			'redirect_url' => '',
			'checkout_url' => '',
			'status' => isset($attributes['status']) ? $attributes['status'] : 'DEFAULT',
			'refresh_when_paid' => $this->payos_gateway_settings['refresh_upon_successful_payment']
		);

		// Test if there is a specific status and set the redirect url and message accordingly
		if ($payos_data['status'] === 'PENDING' && isset($attributes['order_id'])) {
			$order = wc_get_order($attributes['order_id']);
			if ($order) {
				$payos_data['redirect_url'] = $order->get_checkout_order_received_url();
				$payos_data['checkout_url'] =  isset($attributes['checkout_url']) ? $attributes['checkout_url'] : '';
				$payos_data['icon'] =  PAYOS_GATEWAY_URL . '/assets/img/success.png';
				$payos_data['message'] = __('Order has been successfully paid.', 'payos');
			}
		} elseif ($payos_data['status'] === 'PAID') {
			$payos_data['icon'] = PAYOS_GATEWAY_URL . '/assets/img/success.png';
			$payos_data['message'] = __('Order has been successfully paid.', 'payos');
			$payos_data['refresh_when_paid'] = 'no';
		} elseif ($payos_data['status'] === 'ERROR') {
			$payos_data['icon'] = PAYOS_GATEWAY_URL . '/assets/img/failed.png';
			$payos_data['message'] = __('Cannot show payment link', 'payos');
		}

		// Register and enqueue the script
		wp_enqueue_style('payos-checkout-styles', PAYOS_GATEWAY_URL . '/assets/css/payos-checkout.css', array(), false, 'all');
		global $wp_styles;
		if (isset($wp_styles->registered['payos-checkout-styles']) && $wp_styles->registered['payos-checkout-styles']->args !== 'all') {
			$wp_styles->registered['payos-checkout-styles']->args = 'all';
		}
		wp_register_script('payos-checkout-script', PAYOS_GATEWAY_URL . '/assets/js/payos-checkout.js', array('jquery'), false, true);
		wp_localize_script('payos-checkout-script', 'payos_checkout_data', $payos_data);
		wp_enqueue_script('payos-checkout-script');

		// Output the shortcode content
		return '<div id="payos-checkout-container"></div>';
	}

	public function use_payment_gateway_template(string $status = null, string $checkout_url = null, $order = null)
	{
		$order_id = $order ? $order->get_id() : null;
		echo do_shortcode('[payos_checkout status="' . $status . '" order_id="' . $order_id . '" checkout_url="' . $checkout_url . '"]');
	}

	/**
	 * Output for the order received page.
	 *
	 * @param int $order_id Order ID.
	 */
	public function payos_thankyou_page($order_id)
	{
		// loading ui
		$this->use_payment_gateway_template();
		$logger = wc_get_logger();
		try {
			$order = wc_get_order($order_id);
			if (!$order) {
				throw new Exception(sprintf('Not found order #%d', $order_id));
			}
			// order not use payOS, do nothing
			if ($this->id !== $order->get_payment_method()) {
				return;
			}

			// return if paid
			if (str_contains($this->payos_gateway_settings["order_status"]["order_status_after_paid"], $order->get_status())) {
				$this->use_payment_gateway_template('PAID');
				return;
			}
		} catch (Exception $e) {
			// if there was an error, log to a file and add an order note
			$logger->error(
				sprintf('Error when get order #%d', $order_id),
				array('source' => 'payos', 'order' => $order_id, 'error' => $e->getMessage())
			);
			$this->use_payment_gateway_template('ERROR');
			return;
		}

		// get checkout url
		try {
			$checkout_url = $this->get_payos_payment_url($order_id);
			$this->use_payment_gateway_template('PENDING', $checkout_url, $order);
		} catch (Exception $e) {
			$logger->error('Error when create payment link', array('source' => 'payos', 'order' => $order_id, 'error' => $e->getMessage()));
			$this->use_payment_gateway_template('ERROR');
			return;
		}
	}

	/**
	 * Add content to the WC emails.
	 *
	 * @param WC_Order $order Order object.
	 * @param bool     $sent_to_admin Sent to admin.
	 * @param bool     $plain_text Email format: plain text or HTML.
	 */
	public function email_instructions($order, $sent_to_admin, $plain_text = false)
	{
		if (!$sent_to_admin && $this->id === $order->get_payment_method() && $order->has_status('on-hold')) {
			if ($this->instructions) {
				echo wp_kses_post(wpautop(wptexturize($this->instructions)) . PHP_EOL);
			}
		}
	}

	/**
	 * Process the payment and return the result.
	 *
	 * @param int $order_id Order ID.
	 * @return array
	 */
	public function process_payment($order_id)
	{
		$order = wc_get_order($order_id);
		if ($order->get_total() > 0) {
			// Mark as on-hold (we're awaiting the payment).
			$order->update_status(apply_filters('woocommerce_payos_process_payment_order_status', 'on-hold', $order), __('Awaiting payment', 'payos'));
		} else {
			$order->payment_complete();
		}

		// Remove cart.
		WC()->cart->empty_cart();

		// Return thankyou redirect.
		return array(
			'result'   => 'success',
			'redirect' => $this->get_return_url($order),
		);
	}

	public function get_payos_payment_url($order_id)
	{
		$order = wc_get_order($order_id);
		$payos_gateway_settings = self::payos_get_gateway_settings();
		if ($order->get_payment_method() !== 'payos') {
			throw new Exception(__('Not use PayOS as payment method', 'payos'));
		}
		if (!isset($payos_gateway_settings['use_payment_gateway']) || $payos_gateway_settings['use_payment_gateway'] !== 'yes') {
			throw new Exception(__('Not use PayOS payment gateway', 'payos'));
		}
		$payment_link_id = $order->get_meta('_wc_order_payos_payment_link_id') ?? null;
		if ($payment_link_id) {
			return self::$PAYOS_CHECKOUT_HOST . '/embedded/' . $payment_link_id;
		}
		try {
			parse_str(sanitize_text_field($_SERVER['QUERY_STRING']), $query_str_arr);
			$query_str_arr = array_map('sanitize_text_field', $query_str_arr);
			if ($query_str_arr && array_key_exists("code", $query_str_arr)) return;

			$order_id = $order->get_id();
			$woo_checkout_url = wc_get_checkout_url();
			if (substr($woo_checkout_url, -1) != '/') {
				$woo_checkout_url = $woo_checkout_url . '/';
			}
			$redirect_url = $order->get_checkout_order_received_url();

			$item_cart = array();
			foreach ($order->get_items() as $item_id => $item) {
				$product_name = $item->get_name();
				$quantity = $item->get_quantity();
				$total = intval($item['total']);
				array_push($item_cart, array(
					'name' => $product_name,
					'quantity' => $quantity,
					'price' => $total
				));
			}
			$data = array(
				"orderCode" => $order->get_id(),
				"description" => sanitize_text_field($this->payos_gateway_settings['transaction_prefix'] . $order->get_id()),
				"amount" => intval($order->get_total()),
				"buyerName" => $order->get_billing_first_name() . ' ' . $order->get_billing_last_name(),
				"buyerEmail" => $order->get_billing_email(),
				"items" => $item_cart,
				"returnUrl" => $redirect_url,
				"cancelUrl" => $redirect_url
			);
			// create signature for request data
			$request_data_signature = $this->create_signature_payment_request($data["amount"], $data["cancelUrl"], $data["description"], $data["orderCode"], $data["returnUrl"]);
			$data["signature"] = $request_data_signature;

			$result = $this->handle_fetch_payos(self::$PAYOS_URL_CREATE_PAYMENT_LINK, 'POST', $data);
			$order->update_meta_data('_wc_order_payos_payment_link_id', $result['paymentLinkId']);
			$order->save();
			return str_replace('/web/', '/embedded/', $result['checkoutUrl']);
		} catch (Exception $e) {
			if (intval($e->getCode()) === self::$PAYOS_ORDER_EXIST) {
				$result = $this->handle_fetch_payos(self::$URL_GET_PAYMENT_LINK_INFO . $order->get_id());
				$order->update_meta_data('_wc_order_payos_payment_link_id', $result['id']);
				$order->save();
				return self::$PAYOS_CHECKOUT_HOST . '/embedded/' . $result['id'];
			}
			throw new Exception(esc_html($e->getMessage()), intval($e->getCode()));
		}
	}

	public function payos_order_received_text($text, $order)
	{
		if ($order && $order->get_payment_method() === 'payos') {
			$status = $order->get_status();
			$order_status_after_failed = isset($this->payos_gateway_settings["order_status"]["order_status_after_failed"]) ? $this->payos_gateway_settings["order_status"]["order_status_after_failed"] : '';
			$order_status_after_paid = isset($this->payos_gateway_settings["order_status"]["order_status_after_paid"]) ? $this->payos_gateway_settings["order_status"]["order_status_after_paid"] : '';
			$order_status_after_underpaid = isset($this->payos_gateway_settings["order_status"]["order_status_after_underpaid"]) ? $this->payos_gateway_settings["order_status"]["order_status_after_underpaid"] : '';
			switch ($status) {
				case str_contains($order_status_after_failed, $order->get_status()):
					return esc_html__('Your order has been cancelled.', 'payos');
				case str_contains($order_status_after_underpaid, $order->get_status()):
					return esc_html__('Your order is underpaid.', 'payos');
				case str_contains('wc-completed', $order->get_status()):
				case str_contains('wc-refunded', $order->get_status()):
				case str_contains($order_status_after_paid, $order->get_status()):
					return esc_html__('Thank you. Your order has been fulfilled.', 'payos');
				default:
					return esc_html__('Thank you. Your order is processing.', 'payos');
			}
		}
		return $text;
	}

	public function payos_get_order_statuses_after_paid()
	{
		$wooRemovedStatuses = array(
			'wc-pending',
			// 'wc-processing',
			// 'wc-on-hold',
			// 'wc-completed',
			'wc-underpaid',
			'wc-cancelled',
			'wc-refunded',
			'wc-failed',
		);
		$statuses =  wc_get_order_statuses();
		for ($i = 0; $i < count($wooRemovedStatuses); $i++) {
			$statusName = $wooRemovedStatuses[$i];
			if (isset($statuses[$statusName])) {
				unset($statuses[$statusName]);
			}
		}
		return $statuses;
	}

	public function payos_get_order_statuses_after_underpaid()
	{
		$wooRemovedStatuses = array(
			'wc-pending',
			'wc-processing',
			'wc-on-hold',
			'wc-completed',
			// 'wc-underpaid',
			// 'wc-cancelled',
			// 'wc-refunded',
			// 'wc-failed',
		);
		$statuses =  wc_get_order_statuses();
		for ($i = 0; $i < count($wooRemovedStatuses); $i++) {
			$statusName = $wooRemovedStatuses[$i];
			if (isset($statuses[$statusName])) {
				unset($statuses[$statusName]);
			}
		}
		return $statuses;
	}

	public function payos_get_order_statuses_after_failed()
	{
		$wooRemovedStatuses = array(
			'wc-pending',
			'wc-processing',
			'wc-on-hold',
			'wc-completed',
			'wc-underpaid',
			// 'wc-cancelled',
			// 'wc-refunded',
			// 'wc-failed',
		);
		$statuses =  wc_get_order_statuses();
		for ($i = 0; $i < count($wooRemovedStatuses); $i++) {
			$statusName = $wooRemovedStatuses[$i];
			if (isset($statuses[$statusName])) {
				unset($statuses[$statusName]);
			}
		}
		return $statuses;
	}

	public function payos_verify_payment_handler()
	{
		$logger = wc_get_logger();
		$txtBody = file_get_contents('php://input');
		$body = json_decode(str_replace('\\', '\\\\', $txtBody), true);
		$is_test_webhook = $body['desc'] == 'Giao dich thu nghiem' || $body['data']['description'] == 'VQRIO123' || $body['data']['reference'] == 'MA_GIAO_DICH_THU_NGHIEM';
		try {
			if ($body['code'] !== self::$PAYOS_SUCCESS) {
				throw new Exception(strval($body['desc']), intval($body['code']));
			}
			if ($is_test_webhook) {
				echo esc_html__('Webhook delivered successfully', 'payos');
				die();
			}
			$transaction = $body['data'];
			$order_code = $transaction['orderCode'];
			$order = wc_get_order($order_code);
			if (!$order) {
				/* translators: %d: order code */
				throw new Exception(sprintf(__('Error when get order #%d', 'payos'), $order_code));
			}
			$payos_gateway_settings = get_option('payos_gateway_settings');
			// --------------Xac thuc du lieu webhook-------------------
			$signature = $this->create_signature($transaction);
			if (!$body['signature'] || $signature !== $body['signature']) {
				if (!$is_test_webhook) {
					$order->update_status($payos_gateway_settings['order_status']['order_status_after_failed']);
					$order->add_order_note(__('Order has been cancelled', 'payos'));
				}
				throw new Exception(__('Data not integrity', 'payos'));
			}
			// ---------------------------------------------------------
			// Xu ly du lieu giao dich
			$current_amount_paid = intval($order->get_meta('_wc_order_payos_amount_paid', true)) ?? 0;
			$new_transaction_amount = intval($transaction['amount']);
			$updated_amount_paid = $current_amount_paid + $new_transaction_amount;
			$order->update_meta_data('_wc_order_payos_amount_paid', $updated_amount_paid);

			// Calculate the remaining amount to be paid
			$rest_amount = intval($order->get_total()) - $updated_amount_paid;

			switch (true) {
				case $rest_amount <= 0:
					$order->payment_complete();
					wc_reduce_stock_levels($order->get_id());
					if (isset($payos_gateway_settings['order_status']['order_status_after_paid'])) {
						$order->update_status($payos_gateway_settings['order_status']['order_status_after_paid']);
					}
					if ($rest_amount < 0) {
						$order->add_order_note(__('Order has been overpaid', 'payos'));
					}
					break;

				case $rest_amount > 0:
					if (isset($payos_gateway_settings['order_status']['order_status_after_underpaid'])) {
						$order->update_status($payos_gateway_settings['order_status']['order_status_after_underpaid']);
						$order->add_order_note(__('Order has been underpaid', 'payos'));
					}
					break;

				default:
					break;
			}

			// Save the updated meta data
			$order->save();
			$transaction_note = sprintf(
				/* translators: 1: order code, 2: amount, 3: description, 4: account number, 5: reference */
				__('<b>Transaction Information:</b> <br> Order Code: %1$s <br> Amount: %2$s <br> Description: %3$s <br> Account Number: %4$s <br> Reference: %5$s', 'payos'),
				$transaction['orderCode'],
				$transaction['amount'],
				$transaction['description'],
				$transaction['accountNumber'],
				$transaction['reference']
			);
			$order->add_order_note($transaction_note);
			echo esc_html__('Webhook delivered successfully', 'payos');
			die();
		} catch (Exception $e) {
			$logger->error(wc_print_r($body, true), array('error' => $e->getMessage(), 'source' => 'payos-webhook'));
			$response = array('code' => $e->getCode(), 'message' => $e->getMessage());
			http_response_code(500);
			echo wp_json_encode($response);
			die();
		}
	}

	public function payos_payment_page($order_id)
	{
		$order = wc_get_order($order_id);
		if ($this->id === $order->get_payment_method()) {
			$payment_url = $this->get_payos_payment_url($order_id);
			header("Location: {$payment_url}");
			die();
		}
	}

	public function payos_create_webhook($settings)
	{
		$logger = wc_get_logger();
		$response = null;
		$body = array(
			"webhookUrl" => self::get_webhook_url()
		);

		$url  = self::$PAYOS_URL_CONFIRM_WEBHOOK;
		$args = array(
			'body'        => wp_json_encode($body),
			'headers' => array(
				"Content-Type"  => "application/json",
				"x-client-id"   => $settings['client_id'],
				"x-api-key"     => $settings['api_key']
			)
		);
		$response = wp_remote_post($url, $args);

		if (is_wp_error($response)) {
			$logger->error(__('Webhook creation request failed: ', 'payos') . $response->get_error_message(), array('source' => 'payos-webhook'));
			return null;
		}

		$body_response = json_decode($response['body'], true);
		if (($response['response']['code'] == 200 || $response['response']['code'] == 201) && $body_response['code'] == '00') {
			$logger->info(__('Webhook confirmed', 'payos'), array('source' => 'payos-webhook'));
			$body = wp_remote_retrieve_body($response);
			return $body;
		}

		$logger->warning(__('Webhook creation response did not meet success criteria.', 'payos'), array('source' => 'payos-webhook', 'error' => $response));
		return null;
	}

	public function create_signature($data)
	{
		ksort($data);
		$data_str_arr = [];
		foreach ($data as $key => $value) {
			if ($value === "undefined" || $value === "null" || gettype($value) == "NULL") {
				$value = "";
			}
			if (is_array($value)) {
				$value_sorted_ele_obj = array_map(function ($ele) {
					ksort($ele);
					return $ele;
				}, $value);
				$value = wp_json_encode($value_sorted_ele_obj, JSON_UNESCAPED_UNICODE);
			}
			$data_str_arr[] = $key . "=" . $value;
		}
		$data_str = implode('&', $data_str_arr);
		$signature = hash_hmac('sha256', $data_str, $this->payos_gateway_settings['checksum_key']);
		return $signature;
	}

	public function create_signature_payment_request($amount, $cancel_url, $description, $order_code, $return_url)
	{
		$data_str = "amount={$amount}&cancelUrl={$cancel_url}&description={$description}&orderCode={$order_code}&returnUrl={$return_url}";
		$signature = hash_hmac('sha256', $data_str, $this->payos_gateway_settings['checksum_key']);
		return $signature;
	}

	static function get_webhook_url()
	{
		return WC()->api_request_url(self::$PAYOS_WEBHOOK_ENDPOINT);
	}

	public function handle_fetch_payos(string $url, string $method = 'GET', $data = null)
	{
		$client_id = $this->payos_gateway_settings['client_id'];
		$api_key = $this->payos_gateway_settings['api_key'];
		$args = [
			'method'    => $method,
			'headers'   => [
				'Content-Type' => 'application/json',
				'x-client-id'  => $client_id,
				'x-api-key'    => $api_key,
			],
			'body'      => $data ? wp_json_encode($data) : '',
			'timeout'   => 45,
		];

		$response = wp_remote_request($url, $args);

		if (is_wp_error($response)) {
			throw new Exception(esc_html($response->get_error_message()));
		}

		$body = wp_remote_retrieve_body($response);
		$result = json_decode($body, true);

		if ($result['code'] !== self::$PAYOS_SUCCESS) {
			throw new Exception(esc_html($result['desc']), intval($result['code']));
		}

		// Check data integrity by verifying the signature
		$checkout_response = $result['data'];
		$checkout_response_signature = $this->create_signature($checkout_response);

		if ($checkout_response_signature !== $result['signature']) { // Data integrity check failed
			throw new Exception(__('Data not integrity', 'payos'));
		}

		return $checkout_response;
	}
}
