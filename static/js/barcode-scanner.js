document.getElementById('abrirCamera').addEventListener('click', async () => {
    const container = document.getElementById('cameraContainer');
    container.style.display = 'block';

    // Para evitar múltiplas inicializações
    if (Quagga.initialized) {
        Quagga.start();
        return;
    }

    Quagga.init({
        inputStream: {
            name: "Live",
            type: "LiveStream",
            target: container,
            constraints: {
                facingMode: "environment" // câmera traseira no mobile
            }
        },
        decoder: {
            readers: ["ean_reader", "code_128_reader"]
        },
        locate: true
    }, function(err) {
        if (err) {
            console.error("Erro ao iniciar Quagga:", err);
            showMessage('Erro ao iniciar a câmera.', 'error');
            return;
        }

        Quagga.initialized = true;
        Quagga.start();

        Quagga.onDetected(data => {
            if (!data || !data.codeResult || !data.codeResult.code) return;

            document.getElementById('codigoBarras').value = data.codeResult.code;
            document.getElementById('cameraContainer').innerHTML = ''; // Limpa o container da câmera
            Quagga.stop();
            showMessage('Código lido com sucesso!', 'success');
        });
    });
});