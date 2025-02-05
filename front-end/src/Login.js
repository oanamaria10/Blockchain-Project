import React, { useState } from 'react';
import { ethers } from 'ethers';

const Login = ({ onLogin }) => {
    return (
        <div>
            <button onClick={onLogin}>Connect with MetaMask</button>
        </div>
    );
};

export default Login;
