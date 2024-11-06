
import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
    guest: {
        // type: mongoose.Schema.Types.ObjectId,
        type: String,
    },
    vci: {
        type: String,
    },
    amount: {
        type: Number,
    },
    status: {
        type: String,
    },
    buyOrder: {
        type: String,
    },
    sessionId: {
        type: String,
    },
    cardDetail: {
        cardNumber: {
            type: Number,
        }
    },
    accountingDate: {
        type: String,
    },
    transactionDate: {
        type: Date,
    },
    autorizationCode: {
        type: String,
    },
    paymentTypeCode: {
        type: String,
    },
    responseCode: {
        type: Number,
    },
    installmentsAmount: {
        type: Number,
    },
    installmentsNumber: {
        type: Number,
    },
    balance: {
        type: Number,
    }
});

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;