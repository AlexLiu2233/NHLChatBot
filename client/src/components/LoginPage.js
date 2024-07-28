import React, { useState, useEffect, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import { Service } from './Service';
import { Player } from '@lottiefiles/react-lottie-player';
import animationData from '../animations/MascotPanda.json';
import '../style.css';

const LoginPage = ({ setIsAuthenticated }) => {
    const history = useHistory();
    const [usernameBoxes, setUsernameBoxes] = useState([]);
    const [passwordBoxes, setPasswordBoxes] = useState([]);
    const [message, setMessage] = useState('');
    const usernameRefs = useRef([]);
    const passwordRefs = useRef([]);

    const correctUsername = "VANCOUVER CANUCKS"; // Example correct username
    const correctPassword = "HUGHES"; // Example correct password

    useEffect(() => {
        setUsernameBoxes(correctUsername.split('').map((char, index) => ({
            letter: '', class: '', editable: char !== ' ', ref: React.createRef()
        })));
        setPasswordBoxes(correctPassword.split('').map((char, index) => ({
            letter: '', class: '', editable: char !== ' ', ref: React.createRef()
        })));
    }, []);

    const handleGuess = async (e) => {
        e.preventDefault();
        const usernameGuess = usernameBoxes.map(box => box.letter || ' ').join('').trim().toUpperCase();
        const passwordGuess = passwordBoxes.map(box => box.letter || ' ').join('').trim().toUpperCase();

        if (usernameGuess === correctUsername && passwordGuess === correctPassword) {
            const success = await Service.login(usernameGuess, passwordGuess);
            if (success) {
                setMessage('Login successful!');
                setIsAuthenticated(true);
                history.push('/lobby');
            } else {
                setMessage('Login failed. Please try again.');
                highlightBoxes();
            }
        } else {
            setMessage('Incorrect guess. Try again.');
            highlightBoxes();
        }
    };

    const handleInputChange = (type, index, event) => {
        const value = event.target.value.toUpperCase();
        const boxes = type === 'username' ? [...usernameBoxes] : [...passwordBoxes];
        const refs = type === 'username' ? usernameRefs.current : passwordRefs.current;

        if (boxes[index].editable) {
            boxes[index].letter = value;
            type === 'username' ? setUsernameBoxes(boxes) : setPasswordBoxes(boxes);

            if (value && index + 1 < boxes.length) {
                refs[index + 1].focus();
            }
        }
    };

    const highlightBoxes = () => {
        // Add logic to highlight boxes based on correctness
    };

    return (
        <div className="login-container">
            <Player autoplay loop src={animationData} style={{ height: '200px', width: '200px' }} />
            <form onSubmit={handleGuess} className="login-form">
                {usernameBoxes.map((box, index) => (
                    <input
                        key={index}
                        ref={el => usernameRefs.current[index] = el}
                        type="text"
                        maxLength="1"
                        value={box.letter}
                        onChange={(e) => handleInputChange('username', index, e)}
                        className={`letter-box ${box.class} ${box.editable ? '' : 'non-editable'}`}
                        disabled={!box.editable}
                    />
                ))}
                {passwordBoxes.map((box, index) => (
                    <input
                        key={index}
                        ref={el => passwordRefs.current[index] = el}
                        type="text"
                        maxLength="1"
                        value={box.letter}
                        onChange={(e) => handleInputChange('password', index, e)}
                        className={`letter-box ${box.class} ${box.editable ? '' : 'non-editable'}`}
                        disabled={!box.editable}
                    />
                ))}
                <button type="submit">Guess</button>
                <div className="message">{message}</div>
            </form>
        </div>
    );
};

export default LoginPage;
