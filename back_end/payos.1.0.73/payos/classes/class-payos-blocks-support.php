<?php

use Automattic\WooCommerce\Blocks\Payments\Integrations\AbstractPaymentMethodType;

/**
 * payOS payment method integration
 *
 * @since 1.0.0
 */
final class WC_payOS_Blocks_Support extends AbstractPaymentMethodType
{
	/**
	 * Name of the payment method.
	 *
	 * @var string
	 */
	protected $name = 'payos';

	/**
	 * Initializes the payment method type.
	 */
	public function initialize()
	{
		$this->settings = get_option('woocommerce_payos_settings', []);
	}

	/**
	 * Returns if this payment method should be active. If false, the scripts will not be enqueued.
	 *
	 * @return boolean
	 */
	public function is_active()
	{
		$payment_gateways_class   = WC()->payment_gateways();
		$payment_gateways         = $payment_gateways_class->payment_gateways();

		return $payment_gateways['payos']->is_available();
	}

	/**
	 * Returns an array of scripts/handles to be registered for this payment method.
	 *
	 * @return array
	 */
	public function get_payment_method_script_handles()
	{
		$asset_path   = PAYOS_GATEWAY_PATH . '/assets/js/index.asset.php';
		$version      = PAYOS_GATEWAY_VERSION;
		$dependencies = [];
		if (file_exists($asset_path)) {
			$asset        = require $asset_path;
			$version      = is_array($asset) && isset($asset['version'])
				? $asset['version']
				: $version;
			$dependencies = is_array($asset) && isset($asset['dependencies'])
				? $asset['dependencies']
				: $dependencies;
		}
		wp_register_script(
			'payos-blocks-integration',
			PAYOS_GATEWAY_URL . '/assets/js/index.js',
			$dependencies,
			$version,
			true
		);
		wp_set_script_translations(
			'payos-blocks-integration',
			'payos'
		);
		return ['payos-blocks-integration'];
	}

	/**
	 * Returns an array of key=>value pairs of data made available to the payment methods script.
	 *
	 * @return array
	 */
	public function get_payment_method_data()
	{
		$title = $this->get_setting('title');
		$description = $this->get_setting('description');

		return [
			'title'       => $title,
			'description' => $description,
			'supports'    => $this->get_supported_features(),
			'logo_url'    => PAYOS_GATEWAY_URL . '/assets/img/payos.png'
		];
	}

	/**
	 * Returns an array of supported features.
	 *
	 * @return string[]
	 */
	public function get_supported_features()
	{
		$payment_gateways = WC()->payment_gateways->payment_gateways();
		return $payment_gateways['payos']->supports;
	}
}
