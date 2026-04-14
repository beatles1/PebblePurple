module.exports = [
  {
    "type": "heading",
    "defaultValue": "Purple"
  },
  {
    "type": "section",
    "items": [
      {
        "type": "heading",
        "defaultValue": "Colors"
      },
      {
        "type": "color",
        "messageKey": "c_background",
        "defaultValue": "0xAA00FF",
        "label": "Background Colour"
      },
      {
        "type": "color",
        "messageKey": "c_foreground",
        "defaultValue": "0xFFFFFF",
        "label": "Foreground Colour"
      },
      {
        "type": "color",
        "messageKey": "c_battery_good",
        "defaultValue": "0x55FFAA",
        "label": "Battery Good Colour"
      },
      {
        "type": "color",
        "messageKey": "c_battery_bad",
        "defaultValue": "0xAA0000",
        "label": "Battery Bad Colour"
      }
    ]
  },
  {
    "type": "section",
    "items": [
      {
        "type": "heading",
        "defaultValue": "Weather"
      },
      {
        "type": "toggle",
        "messageKey": "b_temp",
        "label": "Show Temperature",
        "defaultValue": true
      },
      {
        "type": "input",
        "messageKey": "i_weather_refresh_mins",
        "label": "Weather Refresh Rate (Mins)",
        "defaultValue": 15,
        "attributes": {
          "type": "number",
          "min": 1,
          "max": 1440
        }
      }
    ]
  },
  {
    "type": "section",
    "items": [
       {
        "type": "heading",
        "defaultValue": "Date"
      },
      {
        "type": "toggle",
        "messageKey": "b_date",
        "label": "Show Date",
        "defaultValue": true
      },
      {
        "type": "toggle",
        "messageKey": "b_short_date",
        "label": "Hide Month",
        "defaultValue": true
      }
    ]
  },
  {
    "type": "submit",
    "defaultValue": "Save Settings"
  }
];
