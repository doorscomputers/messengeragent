# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Node.js bot project for Shopee integration. The project is currently in its initial setup phase with only package dependencies configured.

## Dependencies

The project uses the following key dependencies:
- **Express 5.1.0**: Web framework for API endpoints
- **Axios 1.12.2**: HTTP client for API requests
- **CORS 2.8.5**: Cross-origin resource sharing middleware
- **Body-parser 2.2.0**: Request body parsing middleware
- **Dotenv 17.2.2**: Environment variable management
- **Crypto 1.0.1**: Cryptographic functionality
- **Nodemon 3.1.10**: Development server with auto-restart

## Development Commands

- `npm start` - Run the application in production mode
- `npm run dev` - Development mode with nodemon (auto-restart on changes)
- `npm install` - Install dependencies
- `npm test` - Run tests (currently returns error - no tests configured)

## Architecture Notes

This appears to be designed as a bot service that will:
- Handle HTTP requests through Express
- Make external API calls to Shopee services via Axios
- Manage authentication/encryption with crypto functions
- Support CORS for web client integration

## Development Setup

1. Environment variables should be managed through `.env` file (dotenv is configured)
2. Main entry point is expected to be `index.js` (as specified in package.json)
3. Development server can use nodemon for auto-restart functionality