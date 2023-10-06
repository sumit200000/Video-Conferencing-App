    document.addEventListener('DOMContentLoaded', () => {
    const localVideoElement = document.getElementById('local-video');
    const remoteVideosElement = document.getElementById('remote-videos');
    const startCallButton = document.getElementById('start-call');
    const stopCallButton = document.getElementById('stop-call');
    const startRecordingButton = document.getElementById('start-recording');
    const stopRecordingButton = document.getElementById('stop-recording');
    let localStream;
    let remoteConnections = [];
    const initLocalStream = async () => {
    try {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideoElement.srcObject = localStream;
    } catch (error) {
    console.error('Error accessing user media:', error);
    }
    };
    const createPeerConnection = (socketId) => {
    const peerConnection = new RTCPeerConnection();
    peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
    // Send the ICE candidate to the remote peer
    socket.emit('ice-candidate', { socketId, candidate: event.candidate });
    }
    };
    peerConnection.ontrack = (event) => {
    const remoteVideo = document.createElement('video');
    remoteVideo.srcObject = event.streams[0];
    remoteVideo.autoplay = true;
    remoteVideosElement.appendChild(remoteVideo);
    };
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
    return peerConnection;
    };
    let socket = io();
    socket.on('connect', () => {
    initLocalStream();
    socket.on('new-ice-candidate', (data) => {
    const peerConnection = remoteConnections[data.socketId];
    peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
    });
    socket.on('new-offer', async (data) => {
    const peerConnection = createPeerConnection(data.socketId);
    remoteConnections[data.socketId] = peerConnection;
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit('send-offer', { socketId: data.socketId, offer });
    });
    socket.on('new-answer', async (data) => {
    const peerConnection = remoteConnections[data.socketId];
    await peerConnection.setRemoteDescription(new
    RTCSessionDescription(data.answer));
    });
    socket.on('stop-call', (data) => {
    const peerConnection = remoteConnections[data.socketId];
    peerConnection.close();
    delete remoteConnections[data.socketId];
    });
    });
    startCallButton.addEventListener('click', () => {
    startCallButton.disabled = true;
    stopCallButton.disabled = false;
    startRecordingButton.disabled = false;
    socket.emit('start-call');
    });
    stopCallButton.addEventListener('click', () => {
    startCallButton.disabled = false;
    stopCallButton.disabled = true;
    startRecordingButton.disabled = true;
    remoteVideosElement.innerHTML = '';
    localStream.getTracks().forEach(track => track.stop());
    socket.emit('stop-call');
    });
    startRecordingButton.addEventListener('click', () => {
    startRecordingButton.disabled = true;
    stopRecordingButton.disabled = false;
    // Start recording logic here
    });
    stopRecordingButton.addEventListener('click', () => {
    startRecordingButton.disabled = false;
    stopRecordingButton.disabled = true;
    // Stop recording logic here
    });
    });