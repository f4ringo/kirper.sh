const header = document.getElementById("header");

window.addEventListener('scroll', () => {
  if (window.scrollY > 0) {
    header.classList.add('scrolled');
  } else {
    header.classList.remove('scrolled');
  }
});

function updateTime() {
  const timeElement = document.getElementById("current-time");
  const now = new Date();
  const berlinTime = now.toLocaleTimeString("en-US", {
    timeZone: "Europe/Berlin",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  timeElement.textContent = berlinTime;
}

async function updateWeather() {
  const weatherElement = document.getElementById("weather-info");
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=Berlin&units=metric&appid=f3f9d90d80d5969d3638f438fb2329d9`
    );
    const data = await response.json();
    weatherElement.textContent = `${Math.round(data.main.temp)}°C`;
  } catch (error) {
    weatherElement.textContent = "N/A";
  }
}

updateTime();
updateWeather();
setInterval(updateTime, 60000);