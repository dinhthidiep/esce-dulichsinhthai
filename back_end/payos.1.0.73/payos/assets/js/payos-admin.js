jQuery(document).ready(function () {
  jQuery("#payos_bank_selector2").select2({
    templateResult: formatOptions
  });
});

function formatOptions(state) {
  if (!state.id) {
    return state.text;
  }
  var $state = jQuery(
    `<span ><img style="vertical-align: middle;" src="` + state.title + `"  width="80px"/> ` + state.text + `</span>`
  );
  return $state;
}
function showDetailGateway() {
  var dots = document.getElementById("payos_gateway_info");
  var button = document.getElementById("payos_info_button");

  if (!dots) return;
  if (dots.style.display === "none") {
    dots.style.display = "block";
    button.innerHTML = payos_data.show_less;
  } else {
    dots.style.display = "none";
    button.innerHTML = payos_data.connect_status;
  }
}

function showClientId() {
  var clientId = document.getElementById("payos_client_id");
  var showClientIdBtn = document.getElementById("show_client_id");
  if (clientId.type === "password") {
    clientId.type = "text";
    showClientIdBtn.value = payos_data.hide;
  } else {
    clientId.type = "password";
    showClientIdBtn.value = payos_data.show;
  }
}

function showApiKey() {
  var apiKey = document.getElementById("payos_api_key");
  var showApiKeyBtn = document.getElementById("show_api_key");
  if (apiKey.type === "password") {
    apiKey.type = "text";
    showApiKeyBtn.value = payos_data.hide;
  } else {
    apiKey.type = "password";
    showApiKeyBtn.value = payos_data.show;
  }
}

function showChecksumKey() {
  var checksumKey = document.getElementById("payos_checksum_key");
  var showChecksumKeyBtn = document.getElementById("show_checksum_key");
  if (checksumKey.type === "password") {
    checksumKey.type = "text";
    showChecksumKeyBtn.value = payos_data.hide;
  } else {
    checksumKey.type = "password";
    showChecksumKeyBtn.value = payos_data.show;
  }
}

function togglePayOSSetting(event) {
  event.preventDefault();
  var payOSGatewayGroup = document.getElementById("payos_gateway_settings_group");
  if (payOSGatewayGroup.style.display == "none") {
    payOSGatewayGroup.style.display = "table-row-group";
  }
  else {
    payOSGatewayGroup.style.display = "none";
  }
}