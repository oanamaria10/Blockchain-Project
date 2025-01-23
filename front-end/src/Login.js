import React, { useState } from 'react';

function Login({ accountData, onLogin }) {
    const [address, setAddress] = useState('');
    const [error, setError] = useState('');



   function handleLogin() {
        // Check if address exists in accountData
       if (accountData.includes(address)) {
           onLogin(address);
        } else {
            setError('Address not found.');
        }
    }

    return (
        <div>
            <div>
                <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
            <button onClick={handleLogin}>Login</button>
            {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
    );
}

export default Login;
