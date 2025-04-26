document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const camera = document.getElementById('camera');
    const canvas = document.getElementById('canvas');
    const stripCanvas = document.getElementById('strip');
    const startBtn = document.getElementById('start-btn');
    const downloadBtn = document.getElementById('download-btn');
    const countdownEl = document.getElementById('countdown');
    const previewImg = document.getElementById('preview');
    const statusEl = document.getElementById('status');
    
    // Variables
    let stream = null;
    let photosTaken = 0;
    const totalPhotos = 3;
    let photoImages = [];
    let photoStripReady = false;
    
    // Canvas setup
    const ctx = canvas.getContext('2d');
    const stripCtx = stripCanvas.getContext('2d');
    canvas.width = 640;
    canvas.height = 480;
    
    // Start the photobooth
    startBtn.addEventListener('click', async () => {
        if (!photoStripReady) {
            // Reset if starting a new session
            photosTaken = 0;
            photoImages = [];
            previewImg.style.display = 'none';
            downloadBtn.disabled = true;
            
            try {
                // Request camera access
                stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: false
                });
                
                // Display camera feed
                camera.srcObject = stream;
                
                // Disable button and start countdown
                startBtn.disabled = true;
                statusEl.textContent = 'Get ready!';
                
                // Start the photo sequence
                setTimeout(startPhotoSequence, 1000);
            } catch (error) {
                console.error('Error accessing camera:', error);
                statusEl.textContent = 'Error accessing camera. Please allow camera access.';
                startBtn.disabled = false;
            }
        }
    });
    
    // Download button
    downloadBtn.addEventListener('click', () => {
        if (photoStripReady) {
            const link = document.createElement('a');
            link.download = 'photobooth-strip.png';
            link.href = stripCanvas.toDataURL('image/png');
            link.click();
        }
    });
    
    // Function to start the photo taking sequence
    function startPhotoSequence() {
        if (photosTaken < totalPhotos) {
            // Update status
            statusEl.textContent = `Taking photo ${photosTaken + 1} of ${totalPhotos}`;
            
            // Countdown
            showCountdown(3, () => {
                // Take photo
                takePhoto();
                
                // Schedule next photo
                if (photosTaken < totalPhotos) {
                    setTimeout(startPhotoSequence, 1000);
                } else {
                    // All photos taken, create strip
                    createPhotoStrip();
                }
            });
        }
    }
    
    // Countdown function
    function showCountdown(seconds, callback) {
        countdownEl.style.display = 'block';
        
        const countdownInterval = setInterval(() => {
            countdownEl.textContent = seconds;
            seconds--;
            
            if (seconds < 0) {
                clearInterval(countdownInterval);
                countdownEl.style.display = 'none';
                callback();
            }
        }, 1000);
    }
    
    // Take a photo
    function takePhoto() {
        // Create flash effect
        createFlashEffect();
        
        // Draw video to canvas
        ctx.drawImage(camera, 0, 0, canvas.width, canvas.height);
        
        // Get image data
        const imageData = canvas.toDataURL('image/png');
        
        // Store photo
        const img = new Image();
        img.src = imageData;
        photoImages.push(img);
        
        // Increment counter
        photosTaken++;
        
        // Update status
        if (photosTaken < totalPhotos) {
            statusEl.textContent = `Photo ${photosTaken} taken! Get ready for the next one.`;
        } else {
            statusEl.textContent = 'All photos taken! Creating photo strip...';
        }
    }
    
    // Create a flash effect
    function createFlashEffect() {
        const flash = document.createElement('div');
        flash.className = 'flash';
        document.body.appendChild(flash);
        
        // Animate flash
        flash.style.opacity = '0.8';
        setTimeout(() => {
            flash.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(flash);
            }, 300);
        }, 100);
    }
    
    // Create the photo strip
    function createPhotoStrip() {
        // Stop camera
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            camera.srcObject = null;
        }
        
        // Calculate dimensions
        const photoWidth = 300;
        const photoHeight = 225;
        const padding = 10;
        const textHeight = 50;
        
        // Set strip canvas size
        stripCanvas.width = photoWidth;
        stripCanvas.height = (photoHeight * totalPhotos) + padding + textHeight;
        
        // Clear canvas
        stripCtx.fillStyle = 'white';
        stripCtx.fillRect(0, 0, stripCanvas.width, stripCanvas.height);
        
        // Draw each photo onto the strip
        let waitCount = 0;
        
        function drawImagesWhenReady() {
            if (waitCount < photoImages.length) {
                setTimeout(drawImagesWhenReady, 100);
                return;
            }
            
            // Draw photos
            for (let i = 0; i < photoImages.length; i++) {
                stripCtx.drawImage(
                    photoImages[i],
                    0, i * photoHeight,
                    photoWidth, photoHeight
                );
            }
            
            // Add text at the bottom
            const textY = (photoHeight * totalPhotos) + padding + 30;
            stripCtx.fillStyle = '#ff6b6b';
            stripCtx.font = 'bold 24px Arial';
            stripCtx.textAlign = 'center';
            stripCtx.fillText('you are so pretty', stripCanvas.width / 2, textY);
            
            // Display the strip
            previewImg.src = stripCanvas.toDataURL('image/png');
            previewImg.style.display = 'block';
            
            // Enable download button
            downloadBtn.disabled = false;
            
            // Update status
            statusEl.textContent = 'Your photo strip is ready!';
            startBtn.disabled = false;
            startBtn.textContent = 'Take New Photos';
            
            // Set flag
            photoStripReady = true;
        }
        
        // Make sure all images are loaded
        photoImages.forEach(img => {
            if (!img.complete) {
                img.onload = () => {
                    waitCount++;
                };
            } else {
                waitCount++;
            }
        });
        
        drawImagesWhenReady();
    }
});