import Poco from "commodetto/Poco";
import parseBMF from "commodetto/parseBMF";
import parseRLE from "commodetto/parseRLE";
import Battery from "embedded:sensor/Battery";
import Location from "embedded:sensor/Location";
import Message from "pebble/message";

const render = new Poco(screen);

// Load a custom font from BMF resources
function getFont(name, size) {
    const font = parseBMF(new Resource(`${name}-${size}.fnt`));
    font.bitmap = parseRLE(new Resource(`${name}-${size}-alpha.bm4`));
    return font;
}

// Fonts
const timeFont = getFont("SquaresBoldFree", 110);
const smallFont = getFont("SquaresBoldFree", 18);

// Day and month names
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Precompute layout positions
const hoursY = -15;
const minsY = hoursY + timeFont.height - 35;
const dateY = render.height - smallFont.height - 4 - 10;

// Settings
const DEFAULT_SETTINGS = {
  short_date: true,
  temp: true,
  weather_refresh_mins: 15,
  c_foreground: [255, 255, 255],
  c_background: [170, 0, 255],
  c_battery_good: [85, 255, 170],
  c_battery_bad: [170, 0, 0]
};

function loadSettings() {
    const stored = localStorage.getItem("settings");
    if (stored) {
        try {
            return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
        } catch (e) {
            console.log("Failed to parse settings");
        }
    }
    return { ...DEFAULT_SETTINGS };
}
let settings = loadSettings();

function loadColours() {
  try {
    return {
      c_foreground: render.makeColor(settings.c_foreground[0], settings.c_foreground[1], settings.c_foreground[2]),
      c_background: render.makeColor(settings.c_background[0], settings.c_background[1], settings.c_background[2]),
      c_battery_good: render.makeColor(settings.c_battery_good[0], settings.c_battery_good[1], settings.c_battery_good[2]),
      c_battery_bad: render.makeColor(settings.c_battery_bad[0], settings.c_battery_bad[1], settings.c_battery_bad[2])
    };
  } catch (e) {
    console.log("Failed to load colours")
  }
}
let colours = loadColours();

function saveSettings() {
    localStorage.setItem("settings", JSON.stringify(settings));
    colours = loadColours();
}

// Store latest time for redraws triggered by other events
let lastDate = new Date();

// Weather data
let temp = null;
let latitude = null;
let longitude = null;

// Battery state
let batteryPercent = 100;

const battery = new Battery({
    onSample() {
        batteryPercent = this.sample().percent;
        drawScreen();
    }
});
batteryPercent = battery.sample().percent;

// Weather
let location = null;

function requestLocation() {
    if (settings.temp) {
      location = new Location({
          onSample() {
              const sample = this.sample();
              console.log("Got location: " + sample.latitude + ", " + sample.longitude);
              this.close();
              fetchWeather(sample.latitude, sample.longitude);
          }
      });
    }
}

async function fetchWeather(latitude, longitude) {
    if (settings.temp) {
      try {
          const url = new URL("http://api.open-meteo.com/v1/forecast");
          url.search = new URLSearchParams({
              latitude,
              longitude,
              current: "temperature_2m"
          });
  
          console.log("Fetching weather...");
          const response = await fetch(url);
          const data = await response.json();
  
          temp = Math.round(data.current.temperature_2m);
  
          console.log("Temp: " + temp + "C");
          drawScreen();
      } catch (e) {
          console.log("Weather fetch error: " + e);
      }
    }
}

function drawBatteryBar() {
    // Choose color based on battery level
    let barColor;
    if (batteryPercent <= 20) {
        barColor = colours.c_battery_bad;
    } else {
        barColor = colours.c_battery_good;
    }
    
    // Bar position
    const fillWidth = ((batteryPercent * render.width) / 100);
    const barX = (render.width - fillWidth) / 2;
    const barY = render.height - 4;
    const barHeight = 4;

    // Draw bar
    render.fillRectangle(barColor, barX, barY, fillWidth, barHeight);
}

function drawScreen() {
    const now = lastDate;

    render.begin();
    render.fillRectangle(colours.c_background, 0, 0, render.width, render.height);

    // Draw battery bar
    drawBatteryBar();

    // Format time as HH:MM
    const hours = String(now.getHours()).padStart(2, "0");
    const mins = String(now.getMinutes()).padStart(2, "0");

    // Draw time
    const hour_width = render.getTextWidth(hours, timeFont);
    const min_width = render.getTextWidth(mins, timeFont);
    render.drawText(hours, timeFont, render.makeColor(255, 0, 0), (render.width - hour_width) / 2, hoursY);
    render.drawText(mins, timeFont, colours.c_foreground, (render.width - min_width) / 2, minsY);
    
    // Format date
    const dayName = DAYS[now.getDay()];
    const monthName = MONTHS[now.getMonth()];
    let smallStr;
    
    if (settings.short_date) {
      smallStr = dayName +" "+ String(now.getDate());
    } else {
      smallStr = dayName +" "+ monthName +" "+ String(now.getDate()).padStart(2, "0");
    }
    
    // Add temp
    if (settings.temp) {
      if (temp) {
        smallStr += " | "+ temp +"°C";
      } else {
        smallStr += " | .";
      }
    }

    // Draw date/temp
    const date_width = render.getTextWidth(smallStr, smallFont);
    render.drawText(smallStr, smallFont, colours.c_foreground, (render.width - date_width) / 2, dateY);

    render.end();
}

function minuteTick(event) {
  lastDate = event.date;
  drawScreen();
  if (!temp || ((event.date.getMinutes() % settings.weather_refresh_mins) == 0)) {
    requestLocation();
  }
}
    
// Update every minute (fires immediately when registered)
watch.addEventListener("minutechange", minuteTick);

// Receive 
const message = new Message({
    keys: ["b_short_date", "b_temp", "i_weather_refresh_mins", "c_foreground", "c_background", "c_battery_good", "c_battery_bad"],
    onReadable() {
        const msg = this.read();

        const fg = msg.get("c_foreground");
        if (fg !== undefined) {
          settings.c_foreground = [(fg >> 16) & 0xFF, (fg >> 8) & 0xFF, fg & 0xFF];
          console.log("fg: "+ fg);
        }
        const bg = msg.get("c_background");
        if (bg !== undefined) {
          settings.c_background = [(bg >> 16) & 0xFF, (bg >> 8) & 0xFF, bg & 0xFF];
          console.log("bg: "+ bg);
        }
        const batg = msg.get("c_battery_good");
        if (batg !== undefined) {
          settings.c_battery_good = [(batg >> 16) & 0xFF, (batg >> 8) & 0xFF, batg & 0xFF];
          console.log("batg: "+ batg);
        }
        const batb = msg.get("c_battery_bad");
        if (batb !== undefined) {
          settings.c_battery_bad = [(batb >> 16) & 0xFF, (batb >> 8) & 0xFF, batb & 0xFF];
          console.log("batb: "+ batb);
        }
        const short_date = msg.get("b_short_date");
        if (short_date !== undefined) {
          settings.short_date = short_date === 1;
          console.log("short_date: "+ short_date);
        }
        const temps = msg.get("b_temp");
        if (temps !== undefined) {
          settings.temp = temps === 1;
          console.log("temp: "+ temps);
        }
        const wrm = msg.get("i_weather_refresh_mins");
        if (wrm !== undefined) {
          settings.weather_refresh_mins = parseInt(wrm);
          console.log("weather_refresh_mins: "+ wrm);
        }

        saveSettings();
        drawScreen();
    }
});
