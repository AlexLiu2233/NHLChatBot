import React from 'react';
import { Player } from '@lottiefiles/react-lottie-player';
import animationData from '../animations/MascotPanda.json'; // Ensure this path is correct
import '../style.css';

const LoginPage = () => {
    return (
        <div className="login-container">
            <div className="animation-container">
                <Player
                    autoplay
                    loop
                    src={animationData}
                    style={{ height: '200px', width: '200px' }}
                />
            </div>
            <form method="POST" action="/login" className="login-form">
                <input type="text" name="username" placeholder="Username" required />
                <input type="password" name="password" placeholder="Password" required />
                <input type="submit" value="Login" />
            </form>
        </div>
    );
}

export default LoginPage;
