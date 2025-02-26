# chatapp-node-socketio-mysql-react


Here's an instructions on how to run the project locally and deploy it to cPanel:

**chatapp-node-socketio-mysql-react**
================

**Description**
---------------

This is a Node.js project that uses Express.js as the server-side framework and React.js as the client-side framework.

**Local Development**
--------------------

### Prerequisites

* Node.js (version 14 or higher)
* npm (version 6 or higher)
* cPanel (for deployment)

### Instructions

1. Clone the repository to your local machine:
```bash
git clone https://github.com/deoninja/chatapp-node-socketio-mysql-react.git
```
2. Navigate to the project directory:
```bash
cd chatapp-node-socketio-mysql-react
```
3. Install dependencies:
```bash
npm run install
```
This will install dependencies in the root directory, client directory, and build the client-side code.
4. Start the server:
```bash
npm start
```
This will start the server on port 5000. You can access the application by visiting `http://localhost:5000` in your web browser.

**Deployment to cPanel**
-------------------------

### Prerequisites

* cPanel account with Node.js and npm installed
* FTP/SFTP client (such as FileZilla)

### Instructions

1. Create a new directory in your cPanel account and navigate to it.
2. Upload the project files to the new directory using FTP/SFTP.
3. Create a new Node.js application in cPanel:
	* Go to `Software` > `Setup Node.js App`
	* Select the directory where you uploaded the project files
	* Choose the Node.js version (version 14 or higher)
	* Create the application
4. Configure the application:
	* Go to `Software` > `Node.js App` > `Configure`
	* Set the `Start script` to `server.js`
	* Set the `Environment` to `production`
	* Save changes
5. Deploy the application:
	* Go to `Software` > `Node.js App` > `Deploy`
	* Select the `production` environment
	* Deploy the application

**Troubleshooting**
-------------------

* If you encounter issues during deployment, check the cPanel error logs for more information.
* If you encounter issues during local development, check the console output for more information.

**License**
----------

This project is licensed under the MIT License. See `LICENSE.md` for more information.
