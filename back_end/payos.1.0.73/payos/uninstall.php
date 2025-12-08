<?php

// if uninstall.php is not called by WordPress, die
if (! defined('WP_UNINSTALL_PLUGIN')) {
    die;
}

$option_names = ['woocommerce_payos_settings', 'payos_gateway_settings'];

foreach ($option_names as $option_name) {
    delete_option($option_name);
    // for site options in Multi-site
    delete_site_option($option_name);
}
