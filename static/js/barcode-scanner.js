let quaggaStarted = false;

function startScanner() {
  const container = document.getElementById('cameraContainer');
  const campoCodigo = document.getElementById('codigoBarras');

  // Reset visual
  campoCodigo.value = '';
  container.innerHTML = '';
  container.style.display = 'block';

  if (quaggaStarted) {
    Quagga.stop(); // segurança extra
    Quagga.offDetected();
    quaggaStarted = false;
  }

  Quagga.init({
    inputStream: {
      name: "Live",
      type: "LiveStream",
      target: container,
      constraints: {
        facingMode: "environment"
      }
    },
    decoder: {
      readers: ["ean_reader", "code_128_reader"]
    },
    locate: true
  }, (err) => {
    if (err) {
        console.error("Erro ao iniciar Quagga:", err);
        showMessage('Erro ao iniciar a câmera.', 'error');
      return;
    }

    Quagga.start();
    quaggaStarted = true;

    Quagga.onDetected((data) => {
      const code = data?.codeResult?.code;
      if (code) {
        campoCodigo.value = code;
        Quagga.offDetected(); // remove listener
        Quagga.stop(); // encerra vídeo e canvas
        quaggaStarted = false;
        container.innerHTML = ''; // limpa a câmera

        showMessage('Código lido com sucesso!', 'success');
      }
    });
  });
}

document.getElementById('abrirCamera').addEventListener('click', startScanner);