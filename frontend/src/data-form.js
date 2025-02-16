import { useState } from "react";
import { Box, Button, Accordion, AccordionSummary, AccordionDetails, Typography } from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import axios from "axios";

const endpointMapping = {
  Notion: "notion",
  Airtable: "airtable",
  Hubspot: "hubspot",
};

export const DataForm = ({ integrationType, credentials }) => {
  const [loadedData, setLoadedData] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const endpoint = endpointMapping[integrationType];

  const handleLoad = async () => {
    try {
      const formData = new FormData();
      formData.append("credentials", JSON.stringify(credentials));
      const endpointUrl =
        integrationType === "Hubspot"
          ? `http://localhost:8000/integrations/${endpoint}/get_hubspot_items`
          : `http://localhost:8000/integrations/${endpoint}/load`;

      const response = await axios.post(endpointUrl, formData);
      setLoadedData(response.data);
      // Expand the accordion upon successful data load
      setExpanded(true);
    } catch (e) {
      alert(e?.response?.data?.detail || "An error occurred");
    }
  };

  const handleClear = () => {
    setLoadedData(null);
    setExpanded(false); // Collapse the accordion when data is cleared
  };

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      flexDirection="column"
      width="100%"
    >
      <Box display="flex" flexDirection="column" width="100%">
        <Button onClick={handleLoad} sx={{ mt: 2 }} variant="contained">
          Load Data
        </Button>
        <Button onClick={handleClear} sx={{ mt: 1 }} variant="contained">
          Clear Data
        </Button>
        {loadedData && (
          <Accordion expanded={expanded} onChange={() => setExpanded(!expanded)} sx={{ mt: 2 }}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="loaded-data-content"
              id="loaded-data-header"
            >
              <Typography>Loaded Data</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box
                component="pre"
                sx={{
                  p: 2,
                  bgcolor: '#f5f5f5',
                  borderRadius: '4px',
                  overflow: 'auto',
                  maxHeight: '400px',
                }}
              >
                {JSON.stringify(loadedData, null, 2)}
              </Box>
            </AccordionDetails>
          </Accordion>
        )}
      </Box>
    </Box>
  );
};
