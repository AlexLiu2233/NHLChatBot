import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { Service } from './Service';
import { Player } from '@lottiefiles/react-lottie-player';
import animationData from '../animations/MascotPanda.json';
import '../style.css';

/**
 * LoginPage Component
 * 
 * This component renders a login page with a Wordle-style guessing game.
 * Users are prompted to enter a team name and a player name. Each letter 
 * of the guess is colored based on its correctness:
 * - Green: Correct letter in the correct position
 * - Yellow: Correct letter in the wrong position
 * - Gray: Incorrect letter
 * 
 * Props:
 * - setIsAuthenticated: Function to set the authentication state in the parent component.
 * 
 * State:
 * - teamName: Stores the current team name input by the user.
 * - playerName: Stores the current player name input by the user.
 * - message: Stores the feedback message to be displayed to the user.
 * - teamColors: Stores the color state for each letter of the team name guess.
 * - playerColors: Stores the color state for each letter of the player name guess.
 * 
 * Methods:
 * - handleGuess: Handles the form submission and evaluates the guesses.
 * - getColors: Determines the color of each letter based on its correctness.
 * - renderColoredWord: Renders the word with colored letters.
 * 
 * Example correct guesses:
 * - Team Name: "VANCOUVER CANUCKS"
 * - Player Name: "HUGHES"
 */

const LoginPage = ({ setIsAuthenticated }) => {
    const history = useHistory();
    const [teamName, setTeamName] = useState('');
    const [playerName, setPlayerName] = useState('');
    const [message, setMessage] = useState('');
    const [teamColors, setTeamColors] = useState([]);
    const [playerColors, setPlayerColors] = useState([]);

    const correctTeamName = "VANCOUVER CANUCKS"; // Example correct team name
    const correctPlayerName = "HUGHES"; // Example correct player name

    /**
     * Handles the form submission and evaluates the guesses.
     * Updates the color state based on the correctness of each letter.
     */
    const handleGuess = async (e) => {
        e.preventDefault();
        const teamGuess = teamName.trim().toUpperCase();
        const playerGuess = playerName.trim().toUpperCase();

        setTeamColors(getColors(teamGuess, correctTeamName));
        setPlayerColors(getColors(playerGuess, correctPlayerName));

        if (teamGuess === correctTeamName && playerGuess === correctPlayerName) {
            const success = await Service.login(teamGuess, playerGuess);
            if (success) {
                setMessage('Login successful!');
                setIsAuthenticated(true);
                history.push('/lobby');
            } else {
                setMessage('Login failed. Please try again.');
            }
        } else {
            setMessage('Incorrect guess. Try again.');
        }
    };

    /**
     * Determines the color of each letter based on its correctness.
     * @param {string} guess - The user's guess.
     * @param {string} correct - The correct answer.
     * @returns {Array} - Array of color states for each letter.
     */
    const getColors = (guess, correct) => {
        let colors = new Array(correct.length).fill('absent');
        let correctChars = correct.split('');
        let guessChars = guess.split('');

        // First pass: Check for correct positions
        guessChars.forEach((char, index) => {
            if (char === correctChars[index]) {
                colors[index] = 'correct';
                correctChars[index] = null;
                guessChars[index] = null;
            }
        });

        // Second pass: Check for correct letters in wrong positions
        guessChars.forEach((char, index) => {
            if (char && correctChars.includes(char)) {
                colors[index] = 'present';
                correctChars[correctChars.indexOf(char)] = null;
            }
        });

        return colors;
    };

    /**
     * Renders the word with colored letters.
     * @param {string} word - The word to render.
     * @param {Array} colors - The color states for each letter.
     * @returns {JSX.Element} - The rendered word with colored letters.
     */
    const renderColoredWord = (word, colors) => (
        <div className="word-boxes">
            {word.split('').map((char, index) => (
                <span key={index} className={`letter-box ${colors[index] || ''}`}>{char}</span>
            ))}
        </div>
    );

    return (
        <div className="login-container">
            <Player autoplay loop src={animationData} style={{ height: '200px', width: '200px' }} />
            <form onSubmit={handleGuess} className="login-form">
                <input
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="Enter team name"
                    className="word-input"
                />
                {renderColoredWord(teamName, teamColors)}
                <input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="Enter player name"
                    className="word-input"
                />
                {renderColoredWord(playerName, playerColors)}
                <button type="submit">Guess</button>
                <div className="message">{message}</div>
            </form>
        </div>
    );
};

export default LoginPage;
