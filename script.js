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
    
    // Canvas setup with high resolution
    const ctx = canvas.getContext('2d');
    const stripCtx = stripCanvas.getContext('2d');
    
    // Enable image smoothing for better quality
    ctx.imageSmoothingEnabled = true;
    stripCtx.imageSmoothingEnabled = true;
    
    // Using higher resolution (720p minimum)
    const videoConstraints = {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        aspectRatio: { ideal: 16/9 }
    };
    
    // Setup canvas based on aspect ratio
    function setupCanvas() {
        // Initialize with high resolution
        canvas.width = 1280;
        canvas.height = 720;
    }
    
    setupCanvas();
    
    // Start the photobooth
    startBtn.addEventListener('click', async () => {
        if (!photoStripReady) {
            // Reset if starting a new session
            photosTaken = 0;
            photoImages = [];
            previewImg.style.display = 'none';
            downloadBtn.disabled = true;
            
            try {
                // Request camera access with high quality constraints
                stream = await navigator.mediaDevices.getUserMedia({
                    video: videoConstraints,
                    audio: false
                });
                
                // Display camera feed
                camera.srcObject = stream;
                
                // Wait for video metadata to load to maintain proper aspect ratio
                camera.onloadedmetadata = () => {
                    // Adjust canvas size to match actual video dimensions
                    // This maintains the proper aspect ratio
                    canvas.width = camera.videoWidth;
                    canvas.height = camera.videoHeight;
                };
                
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
            link.href = stripCanvas.toDataURL('image/png', 1.0); // Using highest quality
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
        
        // Draw video to canvas maintaining aspect ratio
        ctx.drawImage(camera, 0, 0, canvas.width, canvas.height);
        
        // Get image data at high quality
        const imageData = canvas.toDataURL('image/png', 1.0);
        
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
        
        // Calculate dimensions based on actual photo size
        // Maintain aspect ratio but scale down if needed
        const aspectRatio = photoImages[0].width / photoImages[0].height;
        const photoWidth = 350;
        const photoHeight = Math.round(photoWidth / aspectRatio);
        const padding = 20;
        const innerPadding = 10;
        const borderRadius = 10;
        const textHeight = 80;
        
        // Set strip canvas size, adding padding between photos
        stripCanvas.width = photoWidth + (padding * 2);
        stripCanvas.height = (photoHeight * totalPhotos) + (innerPadding * (totalPhotos - 1)) + (padding * 2) + textHeight;
        
        // Set background color for strip (soft pastel)
        stripCtx.fillStyle = '#FFF9F9'; // Very light pink
        stripCtx.fillRect(0, 0, stripCanvas.width, stripCanvas.height);
        
        // Draw rounded rectangle function
        function roundedRect(ctx, x, y, width, height, radius) {
            ctx.beginPath();
            ctx.moveTo(x + radius, y);
            ctx.lineTo(x + width - radius, y);
            ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
            ctx.lineTo(x + width, y + height - radius);
            ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
            ctx.lineTo(x + radius, y + height);
            ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
            ctx.lineTo(x, y + radius);
            ctx.quadraticCurveTo(x, y, x + radius, y);
            ctx.closePath();
        }
        
        // Wait for all images to load
        let waitCount = 0;
        
        function drawImagesWhenReady() {
            if (waitCount < photoImages.length) {
                setTimeout(drawImagesWhenReady, 100);
                return;
            }
            
            // Draw photos
            for (let i = 0; i < photoImages.length; i++) {
                // Calculate position with padding between photos
                const yPos = padding + (i * (photoHeight + innerPadding));
                
                // Draw shadow for each photo
                stripCtx.shadowColor = 'rgba(0, 0, 0, 0.2)';
                stripCtx.shadowBlur = 6;
                stripCtx.shadowOffsetX = 0;
                stripCtx.shadowOffsetY = 2;
                
                // Draw white background for each photo with rounded corners
                stripCtx.fillStyle = 'white';
                roundedRect(stripCtx, padding, yPos, photoWidth, photoHeight, borderRadius);
                stripCtx.fill();
                
                // Reset shadow for the image itself
                stripCtx.shadowColor = 'transparent';
                stripCtx.shadowBlur = 0;
                stripCtx.shadowOffsetX = 0;
                stripCtx.shadowOffsetY = 0;
                
                // Create clipping path for rounded corners
                roundedRect(stripCtx, padding, yPos, photoWidth, photoHeight, borderRadius);
                stripCtx.clip();
                
                // Draw the image with proper aspect ratio
                stripCtx.drawImage(
                    photoImages[i],
                    padding, yPos,
                    photoWidth, photoHeight
                );
                
                // Reset clip
                stripCtx.restore();
                stripCtx.save();
            }
            
            // Reset any clipping before drawing text
            stripCtx.restore();
            
            // Add text at the bottom with elegant font
            const textY = (padding * 2) + (photoHeight * totalPhotos) + (innerPadding * (totalPhotos - 1)) + 50;
            stripCtx.fillStyle = '#FF6B8B'; // Pink color for text
            stripCtx.font = '700 26px "Segoe UI", Roboto, "Helvetica Neue", sans-serif';
            stripCtx.textAlign = 'center';
            stripCtx.fillText('you are so pretty', stripCanvas.width / 2, textY);
            
            // Display the strip
            previewImg.src = stripCanvas.toDataURL('image/png', 1.0);
            previewImg.style.display = 'block';
            
            // Enable download button
            downloadBtn.disabled = false;
            
            // Update status
            statusEl.textContent = 'Your photo strip is ready! You can preview it and download.';
            startBtn.disabled = false;
            startBtn.textContent = 'Take New Photos';
            
            // Set flag
            photoStripReady = true;
        }
        
        // Save the context state before any clipping
        stripCtx.save();
        
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