// hubspot.js

import { useState, useEffect } from 'react';
import { Box, Button, CircularProgress } from '@mui/material';
import axios from 'axios';

export const HubspotIntegration = ({ user, org, integrationParams, setIntegrationParams }) => {
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);

    // Function to open OAuth in a new window
    const handleConnectClick = async () => {
        try {
            setIsConnecting(true);
            const formData = new FormData();
            formData.append('user_id', user);
            formData.append('org_id', org);
            const response = await axios.post('http://localhost:8000/integrations/hubspot/authorize', formData);
            const authURL = response?.data;

            const newWindow = window.open(authURL, 'Hubspot Authorization', 'width=600,height=600');
            // Polling for the window to close
            const pollTimer = window.setInterval(() => {
                if (newWindow?.closed !== false) {
                    window.clearInterval(pollTimer);
                    handleWindowClosed();
                }
            }, 200);
        } catch (e) {
            setIsConnecting(false);
            alert(e?.response?.data?.detail || 'An error occurred during authorization.');
        }
    };

    // Function to handle logic when the OAuth window closes
    const handleWindowClosed = async () => {
        try {
            const formData = new FormData();
            formData.append('user_id', user);
            formData.append('org_id', org);
            const response = await axios.post('http://localhost:8000/integrations/hubspot/credentials', formData);
            const credentials = response.data;
            if (credentials) {
                setIsConnected(true);
                setIntegrationParams(prev => ({ ...prev, credentials: credentials, type: 'Hubspot' }));
            }
        } catch (e) {
            alert(e?.response?.data?.detail || 'An error occurred while fetching credentials.');
        } finally {
            setIsConnecting(false);
        }
    };

    useEffect(() => {
        setIsConnected(!!integrationParams?.credentials);
    }, [integrationParams]);

    return (
        <Box sx={{ mt: 2 }}>
            <Box display='flex' alignItems='center' justifyContent='center' sx={{ mt: 2 }}>
                <Button
                    variant='contained'
                    onClick={isConnected ? undefined : handleConnectClick}
                    color={isConnected ? 'success' : 'primary'}
                    disabled={isConnecting || isConnected}
                >
                    {isConnecting ? <CircularProgress size={20} /> : isConnected ? 'Hubspot Connected' : 'Connect to Hubspot'}
                </Button>
            </Box>
        </Box>
    );
};
