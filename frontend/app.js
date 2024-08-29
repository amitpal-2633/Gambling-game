document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost:2000';
    const token = localStorage.getItem('token');

    // Register Form
    if (document.getElementById('registerForm')) {
        document.getElementById('registerForm').addEventListener('submit', async (event) => {
            event.preventDefault();
            const username = document.getElementById('registerUsername').value;
            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;
            const role = document.getElementById('registerRole').value;

            try {
                const response = await fetch(`${API_URL}/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, email, password, role })
                });

                const data = await response.json();
                if (response.ok) {
                    alert('Registration successful');
                    window.location.href = 'login.html'; 
                } else {
                    alert(data.message);
                }
            } catch (error) {
                console.error('Error during registration:', error);
            }
        });
    }

    // Login Form
    if (document.getElementById('loginForm')) {
        document.getElementById('loginForm').addEventListener('submit', async (event) => {
            event.preventDefault();
            const usernameOrEmail = document.getElementById('loginUsernameOrEmail').value;
            const password = document.getElementById('loginPassword').value;

            try {
                const response = await fetch(`${API_URL}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ usernameOrEmail, password })
                });

                const data = await response.json();
                if (response.ok) {
                    localStorage.setItem('token', data.token);
                    // Redirect based on role
                    if (data.role === 'admin') {
                        window.location.href = 'admin.html'; 
                    } else {
                        window.location.href = 'user.html';
                    }
                } else {
                    alert(data.message);
                }
            } catch (error) {
                console.error('Error during login:', error);
            }
        });
    }

    // User Dashboard
    if (document.getElementById('userNumber')) {
        if (!token) {
            window.location.href = 'login.html';
        } else {
            fetch(`${API_URL}/user/info`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            .then(response => response.json())
            .then(data => {
                document.getElementById('userInfo').innerHTML = `
                    <p>Welcome, ${data.username}</p>
                    <p>Balance: $${data.balance}</p> <!-- Display balance here -->
                `;

                document.getElementById('numberForm').addEventListener('submit', async (event) => {
                    event.preventDefault();
                    const number = document.getElementById('userNumber').value;

                    try {
                        const response = await fetch(`${API_URL}/user/selectNumber`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({ number })
                        });

                        const data = await response.json();
                        if (response.ok) {
                            alert('Number selected successfully');
                        } else {
                            alert(data.message);
                        }
                    } catch (error) {
                        console.error('Error selecting number:', error);
                    }
                });

                document.getElementById('logout').addEventListener('click', () => {
                    localStorage.removeItem('token');
                    window.location.href = 'login.html';
                });
            })
            .catch(error => {
                console.error('Fetch error:', error);
                window.location.href = 'login.html'; 
            });
        }
    }

    // Admin Dashboard
    if (document.getElementById('adminNumber')) {
        if (!token) {
            window.location.href = 'login.html';
        } else {
            fetch(`${API_URL}/user/info`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            .then(response => response.json())
            .then(data => {
                if (data.role !== 'admin') {
                    window.location.href = 'user.html';
                } else {
                    document.getElementById('adminInfo').innerText = `Welcome, Admin ${data.username}`;

                    // Fetch and display user details excluding admin
                    fetch(`${API_URL}/admin/users`, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    })
                    .then(response => response.json())
                    .then(users => {
                        const userDetailsBody = document.getElementById('userDetailsBody');
                        userDetailsBody.innerHTML = ''; 
                        users.forEach(user => {
                            if (user.role !== 'admin') { 
                                const row = document.createElement('tr');
                                row.innerHTML = `
                                    <td>${user.username}</td>
                                    <td>${user.email}</td>
                                    <td>${user.role}</td>
                                    <td>${user.balance}</td> <!-- Show balance for admin -->
                                `;
                                userDetailsBody.appendChild(row);
                            }
                        });
                    })
                    .catch(error => {
                        console.error('Fetch error:', error);
                    });
                }
            })
            .catch(error => {
                console.error('Fetch error:', error);
                window.location.href = 'login.html'; 
            });

            document.getElementById('setNumberForm').addEventListener('submit', async (event) => {
                event.preventDefault();
                const number = document.getElementById('adminNumber').value;

                try {
                    const response = await fetch(`${API_URL}/admin/setNumber`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ number })
                    });

                    const data = await response.json();
                    if (response.ok) {
                        alert('Number set successfully');
                    } else {
                        alert(data.message);
                    }
                } catch (error) {
                    console.error('Error setting number:', error);
                }
            });

            document.getElementById('logout').addEventListener('click', () => {
                localStorage.removeItem('token');
                window.location.href = 'login.html';
            });
        }
    }
});
