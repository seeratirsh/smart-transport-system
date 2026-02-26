module.exports = function(io) {

    let activeUsers = 0;

    io.on('connection', (socket) => {

        console.log("User connected");

        // 🔥 Track active users
        activeUsers++;
        io.emit('activeUsers', activeUsers);

        let lat = 28.6139;
        let lng = 77.2090;
        let moving = true;

        const interval = setInterval(() => {

            if (moving) {
                lat += 0.001;
                lng += 0.001;
            }

            socket.emit('busLocation', {
                lat,
                lng,
                moving
            });

            if (Math.random() > 0.85) {
                moving = !moving;
            }

        }, 3000);

        socket.on('disconnect', () => {
            console.log("User disconnected");

            activeUsers--;
            io.emit('activeUsers', activeUsers);

            clearInterval(interval);
        });

    });

};