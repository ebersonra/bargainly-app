// Barcode scanning service using Quagga.js
class BarcodeScanner {
    constructor() {
        this.isScanning = false;
        this.stream = null;
    }

    async startScanning(callback) {
        if (this.isScanning) {
            console.log('Scanner já está ativo');
            return;
        }

        try {
            // Request camera access
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment', // Use back camera
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });

            // Create video element for camera feed
            const video = document.createElement('video');
            video.srcObject = this.stream;
            video.setAttribute('playsinline', true);
            video.play();

            // Create scanner container
            const scannerDiv = document.createElement('div');
            scannerDiv.id = 'barcode-scanner';
            scannerDiv.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: black;
                z-index: 9999;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
            `;

            // Add close button
            const closeBtn = document.createElement('button');
            closeBtn.textContent = 'Fechar Scanner';
            closeBtn.style.cssText = `
                position: absolute;
                top: 20px;
                right: 20px;
                padding: 10px 20px;
                background: #007bff;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
            `;
            closeBtn.onclick = () => this.stopScanning();

            // Add video to scanner
            video.style.cssText = `
                max-width: 100%;
                max-height: 70%;
                object-fit: contain;
            `;

            scannerDiv.appendChild(closeBtn);
            scannerDiv.appendChild(video);
            document.body.appendChild(scannerDiv);

            this.isScanning = true;

            // Initialize Quagga for barcode detection
            if (typeof Quagga !== 'undefined') {
                Quagga.init({
                    inputStream: {
                        name: 'Live',
                        type: 'LiveStream',
                        target: video
                    },
                    decoder: {
                        readers: [
                            'ean_reader',
                            'ean_8_reader',
                            'code_128_reader',
                            'code_39_reader',
                            'code_93_reader',
                            'codabar_reader'
                        ]
                    }
                }, (err) => {
                    if (err) {
                        console.error('Erro ao inicializar Quagga:', err);
                        this.stopScanning();
                        return;
                    }
                    
                    Quagga.start();
                    
                    // Listen for barcode detection
                    Quagga.onDetected((result) => {
                        const code = result.codeResult.code;
                        console.log('Código de barras detectado:', code);
                        
                        // Call callback with detected code
                        if (callback && typeof callback === 'function') {
                            callback(code);
                        }
                        
                        // Auto-close scanner after detection
                        this.stopScanning();
                    });
                });
            } else {
                // Fallback: manual input if Quagga is not available
                console.warn('Quagga.js não disponível. Scanner manual ativado.');
                const input = document.createElement('input');
                input.type = 'text';
                input.placeholder = 'Digite o código de barras';
                input.style.cssText = `
                    padding: 15px;
                    font-size: 18px;
                    border: 2px solid white;
                    border-radius: 5px;
                    margin-top: 20px;
                `;
                
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter' && input.value.trim()) {
                        if (callback && typeof callback === 'function') {
                            callback(input.value.trim());
                        }
                        this.stopScanning();
                    }
                });
                
                scannerDiv.appendChild(input);
                input.focus();
            }

        } catch (error) {
            console.error('Erro ao acessar câmera:', error);
            alert('Erro ao acessar câmera. Verifique as permissões.');
        }
    }

    stopScanning() {
        if (!this.isScanning) return;

        // Stop Quagga if it's running
        if (typeof Quagga !== 'undefined') {
            Quagga.stop();
        }

        // Stop camera stream
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }

        // Remove scanner element
        const scannerElement = document.getElementById('barcode-scanner');
        if (scannerElement) {
            scannerElement.remove();
        }

        this.isScanning = false;
    }

    isActive() {
        return this.isScanning;
    }
}

// Create global scanner instance
const barcodeScanner = new BarcodeScanner();

// Utility function for easy access
function scanBarcode(callback) {
    return barcodeScanner.startScanning(callback);
}

// Browser compatibility check
if (typeof window === 'undefined') {
    // Node.js environment - export as module
    module.exports = {
        BarcodeScanner,
        scanBarcode
    };
} else {
    // Browser environment - make functions globally available
    window.BarcodeScanner = BarcodeScanner;
    window.barcodeScanner = barcodeScanner;
    window.scanBarcode = scanBarcode;
}
