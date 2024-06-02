import React from 'react';
import '../style.css'; // Assuming you extract CSS relevant to LoginPage

function LoginPage() {
    return (
        <div className="login-container">
            <form method="POST" action="/login">
                <input type="text" name="username" placeholder="Username" required />
                <input type="password" name="password" placeholder="Password" required />
                <input type="submit" value="Login" />
            </form>
        </div>
    );
}

export default LoginPage;
