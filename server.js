const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

const bodyParser = require('body-parser');


app.use(bodyParser.json());
app.use(require('./routes/apis/apartments'));
app.use(require('./routes/apis/flats'))
app.use(require('./routes/apis/bills'))
app.use(require('./routes/apis/billpayments'))

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    // updateGasbillMonthly();
});