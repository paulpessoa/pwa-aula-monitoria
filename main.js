document.addEventListener("DOMContentLoaded", () => {
  const unlockButton = document.getElementById("unlock-button");
  const protectedContent = document.getElementById("protected-content");
  const geoButton = document.getElementById("geo-button");
  const geoLocation = document.getElementById("geo-location");
  const speedButton = document.getElementById("speed-button");
  const speed = document.getElementById("speed");
  const directionButton = document.getElementById("direction-button");
  const direction = document.getElementById("direction");
  const torchButton = document.getElementById("torch-button");
  const torchStatus = document.getElementById("torchStatus");
  const shakeMessage = document.getElementById("shake-message");

  let track = null;

  unlockButton.addEventListener("click", () => {
    const password = prompt("Digite a senha para desbloquear:");
    if (password === "1234") {
      protectedContent.style.display = "block";
      alert("Conteúdo desbloqueado!");
    } else {
      alert("Senha incorreta!");
    }
  });

  geoButton.addEventListener("click", () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          geoLocation.textContent = `Localização: Latitude ${position.coords.latitude}, Longitude ${position.coords.longitude}`;
        },
        (error) => {
          geoLocation.textContent = `Erro ao obter localização: ${error.message}`;
        }
      );
    } else {
      geoLocation.textContent = "Geolocalização não é suportada.";
    }
  });

  speedButton.addEventListener("click", () => {
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(
        (position) => {
          speed.textContent = `Velocidade: ${
            position.coords.speed ? position.coords.speed : "Indisponível"
          } m/s`;
        },
        (error) => {
          speed.textContent = `Erro ao obter velocidade: ${error.message}`;
        }
      );
    } else {
      speed.textContent = "Geolocalização não é suportada.";
    }
  });

  directionButton.addEventListener("click", () => {
    if (window.DeviceOrientationEvent) {
      window.addEventListener("deviceorientation", (event) => {
        let alpha = event.alpha;
        if (alpha !== null) {
          let directionString;
          if (alpha >= 45 && alpha < 135) {
            directionString = "Leste";
          } else if (alpha >= 135 && alpha < 225) {
            directionString = "Sul";
          } else if (alpha >= 225 && alpha < 315) {
            directionString = "Oeste";
          } else {
            directionString = "Norte";
          }
          direction.textContent = `Direção: ${directionString}`;
        } else {
          direction.textContent = "Direção: Indisponível";
        }
      });
    } else {
      direction.textContent = "O sensor de orientação não é suportado.";
    }
  });

  torchButton.addEventListener("click", async () => {
    if (!track) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        track = stream.getVideoTracks()[0];
        const imageCapture = new ImageCapture(track);
        const capabilities = await imageCapture.getPhotoCapabilities();
        if (
          capabilities &&
          capabilities.fillLightMode &&
          capabilities.fillLightMode.includes("flash")
        ) {
          toggleTorch(true);
        } else {
          alert("Lanterna não suportada no dispositivo.");
        }
      } catch (error) {
        alert("Erro ao acessar a câmera: " + error.message);
      }
    } else {
      toggleTorch(track.getSettings().torch ? false : true);
    }
  });

  function toggleTorch(state) {
    if (track) {
      track
        .applyConstraints({
          advanced: [{ torch: state }],
        })
        .then(() => {
          torchStatus.textContent = state
            ? "Lanterna Ligada"
            : "Lanterna Desligada";
          torchButton.textContent = state
            ? "Desligar Lanterna"
            : "Ligar Lanterna";
        })
        .catch((error) => {
          alert("Erro ao controlar a lanterna: " + error.message);
        });
    }
  }

  if (window.DeviceMotionEvent) {
    let lastX = null;
    let lastY = null;
    let lastZ = null;
    const threshold = 15;

    window.addEventListener("devicemotion", (event) => {
      const acceleration = event.acceleration;
      if (
        acceleration.x !== null &&
        acceleration.y !== null &&
        acceleration.z !== null
      ) {
        if (lastX !== null && lastY !== null && lastZ !== null) {
          const deltaX = Math.abs(acceleration.x - lastX);
          const deltaY = Math.abs(acceleration.y - lastY);
          const deltaZ = Math.abs(acceleration.z - lastZ);

          if (
            (deltaX > threshold && deltaY > threshold) ||
            (deltaX > threshold && deltaZ > threshold)
          ) {
            showShakeNotification();
            shakeMessage.textContent = "Dispositivo chacoalhado!";
          }
        }
        lastX = acceleration.x;
        lastY = acceleration.y;
        lastZ = acceleration.z;
      }
    });
  }

  function showShakeNotification() {
    if (Notification.permission === "granted") {
      new Notification("Você chacoalhou o dispositivo!");
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          new Notification("Você chacoalhou o dispositivo!");
        }
      });
    }
  }

  if (Notification.permission !== "granted") {
    Notification.requestPermission();
  }
});
