<?php

/**
 * Plugin Name: payOS
 * Plugin URI: https://payos.vn/docs/tich-hop-webhook/woocommerce/
 * Description:  Quick bank transfer by generating QR codes that are accepted by 37 Vietnam banking App: Vietcombank, Vietinbank, BIDV, ACB, VPBank, MBank, TPBank, Digimi, MSB ... Developed for WooCommerce.
 * Author: payOS Team
 * Author URI: https://payos.vn
 * Text Domain: payos
 * Requires Plugins: woocommerce
 * Domain Path: /languages
 * Version: 1.0.73
 * Tested up to: 6.8
 * License: GNU General Public License v3.0
 */


defined('ABSPATH') or exit;
define('PAYOS_GATEWAY_VERSION', '1.0.6');
define('PAYOS_GATEWAY_URL', untrailingslashit(plugins_url(basename(plugin_dir_path(__FILE__)), basename(__FILE__))));
define('PAYOS_GATEWAY_PATH', untrailingslashit(plugin_dir_path(__FILE__)));


// Make sure WooCommerce is active
if (!in_array('woocommerce/woocommerce.php', apply_filters('active_plugins', get_option('active_plugins')))) {
    return;
}

//load plugin code
add_action('plugins_loaded', 'payos_gateway_init', 11);

function payos_gateway_init()
{
    require_once(plugin_basename('classes/class-payos.php'));
}

//register payos gateway 
add_filter('woocommerce_payment_gateways', 'payos_add_gateways');
add_action('plugins_loaded', 'payos_load_plugin_textdomain');
function payos_add_gateways($gateways)
{
    $gateways[] = 'WC_payOS_Payment_Gateway';
    return $gateways;
}

add_action('woocommerce_blocks_loaded', 'payos_woocommerce_blocks_support');

function payos_woocommerce_blocks_support()
{
    require_once dirname(__FILE__) . '/classes/class-payos-blocks-support.php';
    add_action(
        'woocommerce_blocks_payment_method_type_registration',
        function (Automattic\WooCommerce\Blocks\Payments\PaymentMethodRegistry $payment_method_registry) {
            $payment_method_registry->register(new WC_payOS_Blocks_Support);
        }
    );
}

add_action('init', 'payos_add_setting');

function payos_add_setting()
{
    if (class_exists('WooCommerce')) {
        // Add "Settings" link when the plugin is active
        add_filter('plugin_action_links_' . plugin_basename(__FILE__), 'payos_add_settings_link');
        add_filter('wc_order_statuses', 'add_underpaid_to_order_statuses');
        register_post_status('wc-underpaid', array(
            'label' => __('Underpaid', 'payos'),
            'public' => true,
            'show_in_admin_status_list' => true,
            'show_in_admin_all_list' => true,
            'exclude_from_search' => false,
            'label_count' => _n_noop(__('Underpaid', 'payos') . ' (%s)', __('Underpaid', 'payos') . ' (%s)', 'payos')
        ));
        update_setting_options();
    }
}
function payos_add_settings_link($links)
{
    $settings = array('<a href="' . admin_url('admin.php?page=wc-settings&tab=checkout&section=payos') . '">' . __('Setting', 'payos') . '</a>');
    $links    = array_reverse(array_merge($links, $settings));

    return $links;
}
function payos_load_plugin_textdomain()
{
    load_plugin_textdomain('payos', false, dirname(plugin_basename(__FILE__)) . '/languages');
}


function add_underpaid_to_order_statuses($order_statuses)
{
    $new_order_statuses = array();
    foreach ($order_statuses as $key => $status) {
        $new_order_statuses[$key] = $status;
        if ('wc-on-hold' === $key) {
            $new_order_statuses['wc-underpaid'] =  __('Underpaid', 'payos');
        }
    }
    return $new_order_statuses;
}

function update_setting_options()
{
    $old_setting_options = get_option('payos_gateway_settings', WC_payOS_Payment_Gateway::$payos_default_settings);

    if (!array_key_exists('refresh_upon_successful_payment', $old_setting_options)) {
        $new_setting_options = array('refresh_upon_successful_payment' => 'no');
        $updated_setting_options = array_merge($old_setting_options, $new_setting_options);
        update_option('payos_gateway_settings', $updated_setting_options);
    }
}
