/**
 * SessionManager.js
 * 
 * This file defines the SessionManager class which handles session management using cookies.
 * It provides methods for creating sessions, deleting sessions, and middleware for session validation.
 * 
 * Methods:
 * - createSession: Creates a new session and sets a cookie in the response.
 * - deleteSession: Deletes a session based on the request.
 * - middleware: Middleware for validating sessions in incoming requests.
 * - getUsername: Fetches the username associated with a session token.
 * 
 * Dependencies:
 * - crypto: Node.js module for generating random tokens.
 * 
 * Connected Files:
 * - This module is imported and used in server.js for session management.
 * 
 * Usage:
 * Create an instance of the SessionManager class and use its methods for managing user sessions.
 */


const crypto = require('crypto');

class SessionError extends Error { };

function SessionManager() {
	// default session length - you might want to
	// set this to something small during development
	const CookieMaxAgeMs = 600000;

	// keeping the session data inside a closure to keep them protected
	const sessions = {};

	this.createSession = (response, username, maxAge = CookieMaxAgeMs) => {
		const token = crypto.randomBytes(16).toString('hex');
		const sessionData = {
			username: username,
			created: Date.now(),
			expires: Date.now() + maxAge
		};
		sessions[token] = sessionData;

		console.log(`Session created: ${token}`, sessionData);
		console.log('Current sessions:', sessions);

		response.cookie('cpen322-session', token, { maxAge: maxAge });
		setTimeout(() => {
			console.log(`Session expired and removed: ${token}`);
			delete sessions[token];
		}, maxAge);
	};

	this.deleteSession = (request) => {
		const token = request.session;
		if (token && sessions[token]) {
			delete request.username; // Delete the username property of the request
			delete request.session; // Delete the session property of the request
			delete sessions[token]; // Delete the session object from the sessions object
		}
	};

	const decodeCookieValue = (cookieValue) => decodeURIComponent(cookieValue);

	this.middleware = (request, response, next) => {
		const cookieHeader = request.headers.cookie;
		if (!cookieHeader) {
			next(new SessionError('No cookie header found'));
			return;
		}
	
		const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
			const [key, value] = cookie.trim().split('=');
			acc[key] = value;
			return acc;
		}, {});
	
		const token = cookies['cpen322-session'];
		if (!token || !sessions[token]) {
			console.log(`Invalid or missing session: ${token}`);
			next(new SessionError('Invalid session token'));
			return;
		}
	
		request.username = sessions[token].username;
		request.session = token;
		next();
	};
	

	// this function is used by the test script.
	// you can use it if you want.
	this.getUsername = (token) => ((token in sessions) ? sessions[token].username : null);
};

// SessionError class is available to other modules as "SessionManager.Error"
SessionManager.Error = SessionError;

module.exports = SessionManager;