
export function initStripe() {
    var cardIOResponseFields = [
      "card_type",
      "redacted_card_number",
      "card_number",
      "expiry_month",
      "expiry_year",
      "cvv",
      "zip"
    ];

    var onCardIOCheck = function (canScan) {
        var scanBtn = document.getElementById("scanBtn");
        var saveCust = document.getElementById("saveCust");
    };

    CardIO.canScan(onCardIOCheck);
};


