import { Connection, PublicKey } from '@solana/web3.js';
import React, { useEffect, useState } from 'react';
import WebWalletController from '../../controllers/app/web_wallets';
import {
  addContentWithPhantom,
  depositPrizeWithPhantom,
  getContestScoreWithPhantom,
  getContestStatusWithPhantom,
  getPrizeVaultBalanceWithPhantom,
  initializeContestWithPhantom,
  voteForContentWithPhantom,
} from '../../helpers/SolanaContractHelpers/solanaContest';

// Component for testing Solana contest initialization
const SolanaContestInitializer = () => {
  // Tab selection state
  const [activeTab, setActiveTab] = useState('initialize'); // Options: initialize, deposit, submit, vote, balance

  // Form state
  const [formData, setFormData] = useState({
    contestLengthSeconds: 86400, // 1 day
    winnerShares: [5000, 3000, 2000], // 50%, 30%, 20%
    protocolFeePercentage: 500, // 5%
    prizeMint: '', // To be filled by user
    protocolFeeDestination: '', // To be filled by user
  });

  // State for tracking connection and wallet
  const [connection, setConnection] = useState(null);
  const [phantomWallet, setPhantomWallet] = useState(null);
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [transactionResult, setTransactionResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // State for prize deposit form
  const [depositForm, setDepositForm] = useState({
    contestPda: '',
    amount: 100,
  });
  const [depositResult, setDepositResult] = useState(null);
  const [isDepositLoading, setIsDepositLoading] = useState(false);
  const [depositErrorMessage, setDepositErrorMessage] = useState('');

  // State for content submission form
  const [contentForm, setContentForm] = useState({
    contestPda: '',
    contentUrl: '',
  });
  const [contentResult, setContentResult] = useState(null);
  const [isContentLoading, setIsContentLoading] = useState(false);
  const [contentErrorMessage, setContentErrorMessage] = useState('');

  // State for voting form
  const [voteForm, setVoteForm] = useState({
    contestPda: '',
    contentId: 0,
    amount: 1,
  });
  const [voteResult, setVoteResult] = useState(null);
  const [isVoteLoading, setIsVoteLoading] = useState(false);
  const [voteErrorMessage, setVoteErrorMessage] = useState('');

  // State for balance checking
  const [balanceForm, setBalanceForm] = useState({
    contestPda: '',
  });
  const [balanceResult, setBalanceResult] = useState(null);
  const [isBalanceLoading, setIsBalanceLoading] = useState(false);
  const [balanceErrorMessage, setBalanceErrorMessage] = useState('');

  // State for contest status checking
  const [statusForm, setStatusForm] = useState({
    contestPda: '',
  });
  const [statusResult, setStatusResult] = useState(null);
  const [isStatusLoading, setIsStatusLoading] = useState(false);
  const [statusErrorMessage, setStatusErrorMessage] = useState('');

  // State for contest score checking
  const [scoreForm, setScoreForm] = useState({
    contestPda: '',
  });
  const [scoreResult, setScoreResult] = useState(null);
  const [isScoreLoading, setIsScoreLoading] = useState(false);
  const [scoreErrorMessage, setScoreErrorMessage] = useState('');

  // Initialize connection to Solana devnet
  useEffect(() => {
    const conn = new Connection('https://api.devnet.solana.com', 'confirmed');
    setConnection(conn);
  }, []);

  // Get phantom wallet
  useEffect(() => {
    const webWalletController = WebWalletController.Instance;
    const phantom = webWalletController.getByName('phantom');
    setPhantomWallet(phantom);

    // Check if wallet is already connected
    if (phantom && phantom.enabled) {
      setIsWalletConnected(true);
    }
  }, []);

  // Handle connecting to Phantom wallet
  const handleConnectWallet = async () => {
    try {
      if (!phantomWallet) {
        throw new Error(
          'Phantom wallet not found. Please install the Phantom wallet extension.',
        );
      }

      if (!phantomWallet.available) {
        throw new Error(
          'Phantom wallet is not available. Please install the Phantom wallet extension.',
        );
      }

      await phantomWallet.enable();
      setIsWalletConnected(true);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      setErrorMessage(`Failed to connect wallet: ${error.message}`);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === 'winnerShares') {
      // Parse comma-separated values into an array of numbers
      const shares = value
        .split(',')
        .map((share) => parseInt(share.trim(), 10));
      setFormData({
        ...formData,
        [name]: shares,
      });
    } else if (
      name === 'contestLengthSeconds' ||
      name === 'protocolFeePercentage'
    ) {
      // Convert to number
      setFormData({
        ...formData,
        [name]: parseInt(value, 10),
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  // Handle deposit form input changes
  const handleDepositInputChange = (e) => {
    const { name, value } = e.target;

    if (name === 'amount') {
      // Convert to number
      setDepositForm({
        ...depositForm,
        [name]: parseInt(value, 10),
      });
    } else {
      setDepositForm({
        ...depositForm,
        [name]: value,
      });
    }
  };

  // Handle content form input changes
  const handleContentInputChange = (e) => {
    const { name, value } = e.target;
    setContentForm({
      ...contentForm,
      [name]: value,
    });
  };

  // Handle vote form input changes
  const handleVoteInputChange = (e) => {
    const { name, value } = e.target;

    if (name === 'contentId' || name === 'amount') {
      // Convert to number
      setVoteForm({
        ...voteForm,
        [name]: parseInt(value, 10),
      });
    } else {
      setVoteForm({
        ...voteForm,
        [name]: value,
      });
    }
  };

  // Handle balance form input changes
  const handleBalanceInputChange = (e) => {
    const { name, value } = e.target;
    setBalanceForm({
      ...balanceForm,
      [name]: value,
    });
  };

  // Handle status form input changes
  const handleStatusInputChange = (e) => {
    const { name, value } = e.target;
    setStatusForm({
      ...statusForm,
      [name]: value,
    });
  };

  // Handle score form input changes
  const handleScoreInputChange = (e) => {
    const { name, value } = e.target;
    setScoreForm({
      ...scoreForm,
      [name]: value,
    });
  };

  // When a contest is created successfully, pre-fill the deposit form with the contest PDA
  useEffect(() => {
    if (transactionResult && transactionResult.contestPda) {
      const contestPdaString = transactionResult.contestPda.toString();
      setDepositForm({
        ...depositForm,
        contestPda: contestPdaString,
      });
      setContentForm({
        ...contentForm,
        contestPda: contestPdaString,
      });
      setVoteForm({
        ...voteForm,
        contestPda: contestPdaString,
      });
      setBalanceForm({
        ...balanceForm,
        contestPda: contestPdaString,
      });
      setStatusForm({
        ...statusForm,
        contestPda: contestPdaString,
      });
      setScoreForm({
        ...scoreForm,
        contestPda: contestPdaString,
      });
    }
  }, [transactionResult]);

  // Validate input and initialize contest
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    setTransactionResult(null);

    try {
      // Validate input
      if (!connection) {
        throw new Error('Solana connection not established');
      }

      if (!isWalletConnected) {
        throw new Error('Please connect your Phantom wallet first');
      }

      // Validate winner shares sum to 10000 (100%)
      const sharesSum = formData.winnerShares.reduce(
        (sum, share) => sum + share,
        0,
      );
      if (sharesSum !== 10000) {
        throw new Error(
          `Winner shares must add up to 10000 (100%). Current sum: ${sharesSum}`,
        );
      }

      // Validate protocol fee percentage is between 0 and 10000
      if (
        formData.protocolFeePercentage < 0 ||
        formData.protocolFeePercentage > 10000
      ) {
        throw new Error('Protocol fee percentage must be between 0 and 10000');
      }

      // Validate public keys
      if (!formData.prizeMint || !formData.protocolFeeDestination) {
        throw new Error('Prize mint and protocol fee destination are required');
      }

      const prizeMintPublicKey = new PublicKey(formData.prizeMint);
      const protocolFeeDestinationPublicKey = new PublicKey(
        formData.protocolFeeDestination,
      );

      // Initialize contest
      const result = await initializeContestWithPhantom(
        phantomWallet,
        connection,
        {
          prizeMint: prizeMintPublicKey,
          protocolFeeDestination: protocolFeeDestinationPublicKey,
          contestLengthSeconds: formData.contestLengthSeconds,
          winnerShares: formData.winnerShares,
          protocolFeePercentage: formData.protocolFeePercentage,
        },
      );

      setTransactionResult(result);
    } catch (error) {
      console.error('Failed to initialize contest:', error);
      setErrorMessage(`Failed to initialize contest: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle deposit form submission
  const handleDepositSubmit = async (e) => {
    e.preventDefault();
    setIsDepositLoading(true);
    setDepositErrorMessage('');
    setDepositResult(null);

    try {
      // Validate input
      if (!connection) {
        throw new Error('Solana connection not established');
      }

      if (!isWalletConnected) {
        throw new Error('Please connect your Phantom wallet first');
      }

      // Validate fields
      if (!depositForm.contestPda) {
        throw new Error('Contest PDA is required');
      }

      if (depositForm.amount <= 0) {
        throw new Error('Amount must be greater than 0');
      }

      // Convert string inputs to PublicKeys
      const contestPdaPublicKey = new PublicKey(depositForm.contestPda);

      // Deposit prize tokens
      const txSignature = await depositPrizeWithPhantom(
        phantomWallet,
        connection,
        contestPdaPublicKey,
        depositForm.amount,
      );

      setDepositResult({
        txSignature,
      });
    } catch (error) {
      console.error('Failed to deposit prize:', error);
      setDepositErrorMessage(`Failed to deposit prize: ${error.message}`);
    } finally {
      setIsDepositLoading(false);
    }
  };

  // Handle content submission form
  const handleContentSubmit = async (e) => {
    e.preventDefault();
    setIsContentLoading(true);
    setContentErrorMessage('');
    setContentResult(null);

    try {
      // Validate input
      if (!connection) {
        throw new Error('Solana connection not established');
      }

      if (!isWalletConnected) {
        throw new Error('Please connect your Phantom wallet first');
      }

      // Validate fields
      if (!contentForm.contestPda) {
        throw new Error('Contest PDA is required');
      }

      if (!contentForm.contentUrl) {
        throw new Error('Content URL is required');
      }

      // Convert string inputs to PublicKeys
      const contestPdaPublicKey = new PublicKey(contentForm.contestPda);

      // Add content to contest
      const result = await addContentWithPhantom(
        phantomWallet,
        connection,
        contestPdaPublicKey,
        contentForm.contentUrl,
      );

      setContentResult(result);
    } catch (error) {
      console.error('Failed to submit content:', error);
      setContentErrorMessage(`Failed to submit content: ${error.message}`);
    } finally {
      setIsContentLoading(false);
    }
  };

  // Handle vote form submission
  const handleVoteSubmit = async (e) => {
    e.preventDefault();
    setIsVoteLoading(true);
    setVoteErrorMessage('');
    setVoteResult(null);

    try {
      // Validate input
      if (!connection) {
        throw new Error('Solana connection not established');
      }

      if (!isWalletConnected) {
        throw new Error('Please connect your Phantom wallet first');
      }

      // Validate fields
      if (!voteForm.contestPda) {
        throw new Error('Contest PDA is required');
      }

      if (voteForm.contentId < 0) {
        throw new Error('Content ID must be a non-negative number');
      }

      if (voteForm.amount <= 0) {
        throw new Error('Vote amount must be greater than 0');
      }

      // Convert string inputs to PublicKeys
      const contestPdaPublicKey = new PublicKey(voteForm.contestPda);

      // Vote for content
      const result = await voteForContentWithPhantom(
        phantomWallet,
        connection,
        contestPdaPublicKey,
        voteForm.contentId,
        voteForm.amount,
      );

      setVoteResult(result);
    } catch (error) {
      console.error('Failed to vote for content:', error);
      setVoteErrorMessage(`Failed to vote for content: ${error.message}`);
    } finally {
      setIsVoteLoading(false);
    }
  };

  // Handle balance check form submission
  const handleBalanceCheckSubmit = async (e) => {
    e.preventDefault();
    setIsBalanceLoading(true);
    setBalanceErrorMessage('');
    setBalanceResult(null);

    try {
      // Validate input
      if (!connection) {
        throw new Error('Solana connection not established');
      }

      if (!isWalletConnected) {
        throw new Error('Please connect your Phantom wallet first');
      }

      // Validate fields
      if (!balanceForm.contestPda) {
        throw new Error('Contest PDA is required');
      }

      // Convert string inputs to PublicKeys
      const contestPdaPublicKey = new PublicKey(balanceForm.contestPda);

      // Get prize vault balance
      const balance = await getPrizeVaultBalanceWithPhantom(
        phantomWallet,
        connection,
        contestPdaPublicKey,
      );

      setBalanceResult({
        balance,
      });
    } catch (error) {
      console.error('Failed to check balance:', error);
      setBalanceErrorMessage(`Failed to check balance: ${error.message}`);
    } finally {
      setIsBalanceLoading(false);
    }
  };

  // Handle contest status check form submission
  const handleStatusCheckSubmit = async (e) => {
    e.preventDefault();
    setIsStatusLoading(true);
    setStatusErrorMessage('');
    setStatusResult(null);

    try {
      // Validate input
      if (!connection) {
        throw new Error('Solana connection not established');
      }

      if (!isWalletConnected) {
        throw new Error('Please connect your Phantom wallet first');
      }

      // Validate fields
      if (!statusForm.contestPda) {
        throw new Error('Contest PDA is required');
      }

      // Convert string input to PublicKey
      const contestPdaPublicKey = new PublicKey(statusForm.contestPda);

      // Get contest status
      const result = await getContestStatusWithPhantom(
        phantomWallet,
        connection,
        contestPdaPublicKey,
      );

      setStatusResult(result);
    } catch (error) {
      console.error('Failed to check contest status:', error);
      setStatusErrorMessage(`Failed to check contest status: ${error.message}`);
    } finally {
      setIsStatusLoading(false);
    }
  };

  // Handle contest score check form submission
  const handleScoreCheckSubmit = async (e) => {
    e.preventDefault();
    setIsScoreLoading(true);
    setScoreErrorMessage('');
    setScoreResult(null);

    try {
      // Validate input
      if (!connection) {
        throw new Error('Solana connection not established');
      }

      if (!isWalletConnected) {
        throw new Error('Please connect your Phantom wallet first');
      }

      // Validate fields
      if (!scoreForm.contestPda) {
        throw new Error('Contest PDA is required');
      }

      // Convert string input to PublicKey
      const contestPdaPublicKey = new PublicKey(scoreForm.contestPda);

      // Get contest score
      const result = await getContestScoreWithPhantom(
        phantomWallet,
        connection,
        contestPdaPublicKey,
      );

      setScoreResult(result);
    } catch (error) {
      console.error('Failed to check contest score:', error);
      setScoreErrorMessage(`Failed to check contest score: ${error.message}`);
    } finally {
      setIsScoreLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Solana Contest Initializer</h1>

      {/* Wallet Connection */}
      <div className="mb-6 p-4 bg-gray-100 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Wallet Connection</h2>
        <div className="flex items-center">
          <div className="mr-4">
            Status:{' '}
            {isWalletConnected ? (
              <span className="text-green-600 font-medium">Connected</span>
            ) : (
              <span className="text-red-600 font-medium">Not Connected</span>
            )}
          </div>
          {!isWalletConnected && (
            <button
              onClick={handleConnectWallet}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
            >
              Connect Phantom Wallet
            </button>
          )}
          {isWalletConnected && phantomWallet && (
            <div className="text-sm text-gray-600">
              Address: {phantomWallet.accounts[0]}
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 p-4 rounded-lg mb-8">
        <h3 className="font-semibold mb-2">Instructions</h3>
        <ol className="list-decimal pl-5 space-y-2 text-sm">
          <li>
            Connect your Phantom wallet (make sure you have some devnet SOL)
          </li>
          <li>Enter the contest parameters</li>
          <li>For Prize Mint, use a valid SPL token mint address on devnet</li>
          <li>
            For Protocol Fee Destination, you can use your own wallet address
          </li>
          <li>
            Click "Initialize Contest" to create a new contest on Solana devnet
          </li>
          <li>
            After creating a contest, you can deposit prize tokens using the
            deposit form
          </li>
          <li>
            Submit content to the contest using the content submission form
          </li>
          <li>
            Vote for content using the voting form (you'll need the content ID)
          </li>
          <li>Check the prize vault balance using the balance checking form</li>
        </ol>
        <p className="mt-2 text-xs">
          This interface uses the Solana devnet. Transactions won't cost real
          SOL but you'll need tokens for the prize mint you specified.
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('initialize')}
          className={`py-3 px-4 text-sm font-medium rounded-t-lg ${
            activeTab === 'initialize'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Initialize Contest
        </button>
        <button
          onClick={() => setActiveTab('deposit')}
          className={`py-3 px-4 text-sm font-medium rounded-t-lg ${
            activeTab === 'deposit'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Deposit Prize
        </button>
        <button
          onClick={() => setActiveTab('submit')}
          className={`py-3 px-4 text-sm font-medium rounded-t-lg ${
            activeTab === 'submit'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Submit Content
        </button>
        <button
          onClick={() => setActiveTab('vote')}
          className={`py-3 px-4 text-sm font-medium rounded-t-lg ${
            activeTab === 'vote'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Vote for Content
        </button>
        <button
          onClick={() => setActiveTab('balance')}
          className={`py-3 px-4 text-sm font-medium rounded-t-lg ${
            activeTab === 'balance'
              ? 'bg-teal-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Check Balance
        </button>
        <button
          onClick={() => setActiveTab('status')}
          className={`py-3 px-4 text-sm font-medium rounded-t-lg ${
            activeTab === 'status'
              ? 'bg-orange-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Contest Status
        </button>
        <button
          onClick={() => setActiveTab('score')}
          className={`py-3 px-4 text-sm font-medium rounded-t-lg ${
            activeTab === 'score'
              ? 'bg-pink-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Contest Score
        </button>
      </div>

      {/* Initialize Contest Form - Only shown when activeTab is 'initialize' */}
      {activeTab === 'initialize' && (
        <div>
          <h2 className="text-xl font-bold mb-4">Initialize New Contest</h2>
          <form onSubmit={handleSubmit} className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contest Length (seconds)
                </label>
                <input
                  type="number"
                  name="contestLengthSeconds"
                  value={formData.contestLengthSeconds}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Example: 86400 (1 day), 604800 (1 week)
                </p>
              </div>

              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Winner Shares (comma-separated)
                </label>
                <input
                  type="text"
                  name="winnerShares"
                  value={formData.winnerShares.join(', ')}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Values in basis points (10000 = 100%). Must sum to 10000.
                  <br />
                  Example: 5000, 3000, 2000 (50%, 30%, 20%)
                </p>
              </div>

              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Protocol Fee Percentage
                </label>
                <input
                  type="number"
                  name="protocolFeePercentage"
                  value={formData.protocolFeePercentage}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Value in basis points (100 = 1%, 500 = 5%, 1000 = 10%)
                </p>
              </div>

              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prize Mint (token address)
                </label>
                <input
                  type="text"
                  name="prizeMint"
                  value={formData.prizeMint}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  The SPL token mint address for the contest prizes
                </p>
              </div>

              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Protocol Fee Destination
                </label>
                <input
                  type="text"
                  name="protocolFeeDestination"
                  value={formData.protocolFeeDestination}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  The wallet address where protocol fees will be sent
                </p>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="submit"
                disabled={!isWalletConnected || isLoading}
                className={`w-full px-4 py-3 text-white rounded font-medium ${
                  !isWalletConnected || isLoading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-purple-600 hover:bg-purple-700 transition-colors'
                }`}
              >
                {isLoading ? 'Initializing...' : 'Initialize Contest'}
              </button>
            </div>
          </form>

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {errorMessage}
            </div>
          )}

          {/* Transaction Result */}
          {transactionResult && (
            <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
              <h3 className="font-semibold mb-2">
                Contest Initialized Successfully!
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <tbody>
                    <tr>
                      <td className="font-medium pr-4 py-1">Contest PDA:</td>
                      <td className="font-mono">
                        {transactionResult.contestPda.toString()}
                      </td>
                    </tr>
                    <tr>
                      <td className="font-medium pr-4 py-1">
                        Prize Vault PDA:
                      </td>
                      <td className="font-mono">
                        {transactionResult.prizeVaultPda.toString()}
                      </td>
                    </tr>
                    <tr>
                      <td className="font-medium pr-4 py-1">
                        Transaction Signature:
                      </td>
                      <td className="font-mono">
                        <a
                          href={`https://explorer.solana.com/tx/${transactionResult.txSignature}?cluster=devnet`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {transactionResult.txSignature}
                        </a>
                      </td>
                    </tr>
                    <tr>
                      <td className="font-medium pr-4 py-1">
                        Contest End Date:
                      </td>
                      <td>
                        {transactionResult.contestEndDate.toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => setActiveTab('deposit')}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  Proceed to Deposit Prize
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Deposit Prize Form - Only shown when activeTab is 'deposit' */}
      {activeTab === 'deposit' && (
        <div>
          <h2 className="text-xl font-bold mb-4">Deposit Prize Tokens</h2>
          <p className="text-sm text-gray-600 mb-4">
            After creating a contest, you can deposit prize tokens to the
            contest's prize vault.
            <br />
            Your associated token account for the contest's prize mint will be
            automatically used. Make sure you have tokens in your wallet for the
            prize mint specified during contest creation.
          </p>

          <form onSubmit={handleDepositSubmit} className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contest PDA
                </label>
                <input
                  type="text"
                  name="contestPda"
                  value={depositForm.contestPda}
                  onChange={handleDepositInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                  placeholder="Enter the contest PDA public key"
                />
                <p className="text-xs text-gray-500 mt-1">
                  The public key of the contest you want to deposit to
                  (auto-filled if you just created one)
                </p>
              </div>

              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount
                </label>
                <input
                  type="number"
                  name="amount"
                  value={depositForm.amount}
                  onChange={handleDepositInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                  min="1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  The amount of tokens to deposit
                </p>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="submit"
                disabled={!isWalletConnected || isDepositLoading}
                className={`w-full px-4 py-3 text-white rounded font-medium ${
                  !isWalletConnected || isDepositLoading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 transition-colors'
                }`}
              >
                {isDepositLoading ? 'Depositing...' : 'Deposit Prize Tokens'}
              </button>
            </div>
          </form>

          {/* Deposit Error Message */}
          {depositErrorMessage && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {depositErrorMessage}
            </div>
          )}

          {/* Deposit Result */}
          {depositResult && (
            <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
              <h3 className="font-semibold mb-2">
                Prize Tokens Deposited Successfully!
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <tbody>
                    <tr>
                      <td className="font-medium pr-4 py-1">
                        Transaction Signature:
                      </td>
                      <td className="font-mono">
                        <a
                          href={`https://explorer.solana.com/tx/${depositResult.txSignature}?cluster=devnet`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {depositResult.txSignature}
                        </a>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => setActiveTab('submit')}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Proceed to Submit Content
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Content Submission Form - Only shown when activeTab is 'submit' */}
      {activeTab === 'submit' && (
        <div>
          <h2 className="text-xl font-bold mb-4">Submit Content to Contest</h2>
          <p className="text-sm text-gray-600 mb-4">
            Add content to a contest by providing the contest PDA and a URL to
            your content.
            <br />
            Content can be anything: an image URL, a text description, or a link
            to a project.
          </p>

          <form onSubmit={handleContentSubmit} className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contest PDA
                </label>
                <input
                  type="text"
                  name="contestPda"
                  value={contentForm.contestPda}
                  onChange={handleContentInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                  placeholder="Enter the contest PDA public key"
                />
                <p className="text-xs text-gray-500 mt-1">
                  The public key of the contest you want to submit content to
                  (auto-filled if you just created one)
                </p>
              </div>

              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Content URL
                </label>
                <input
                  type="text"
                  name="contentUrl"
                  value={contentForm.contentUrl}
                  onChange={handleContentInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                  placeholder="https://example.com/my-content"
                />
                <p className="text-xs text-gray-500 mt-1">
                  URL to your content or a description of your submission
                </p>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="submit"
                disabled={!isWalletConnected || isContentLoading}
                className={`w-full px-4 py-3 text-white rounded font-medium ${
                  !isWalletConnected || isContentLoading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 transition-colors'
                }`}
              >
                {isContentLoading ? 'Submitting...' : 'Submit Content'}
              </button>
            </div>
          </form>

          {/* Content Submission Error Message */}
          {contentErrorMessage && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {contentErrorMessage}
            </div>
          )}

          {/* Content Submission Result */}
          {contentResult && (
            <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
              <h3 className="font-semibold mb-2">
                Content Submitted Successfully!
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <tbody>
                    <tr>
                      <td className="font-medium pr-4 py-1">Content PDA:</td>
                      <td className="font-mono">
                        {contentResult.contentPda.toString()}
                      </td>
                    </tr>
                    <tr>
                      <td className="font-medium pr-4 py-1">Content ID:</td>
                      <td className="font-mono">{contentResult.contentId}</td>
                    </tr>
                    <tr>
                      <td className="font-medium pr-4 py-1">
                        Transaction Signature:
                      </td>
                      <td className="font-mono">
                        <a
                          href={`https://explorer.solana.com/tx/${contentResult.txSignature}?cluster=devnet`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {contentResult.txSignature}
                        </a>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => setActiveTab('vote')}
                  className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                >
                  Proceed to Vote
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Voting Form - Only shown when activeTab is 'vote' */}
      {activeTab === 'vote' && (
        <div>
          <h2 className="text-xl font-bold mb-4">Vote for Content</h2>
          <p className="text-sm text-gray-600 mb-4">
            Vote for content in a contest by providing the contest PDA and the
            content ID.
            <br />
            Each vote costs tokens from your wallet based on the amount you
            specify.
          </p>

          <form onSubmit={handleVoteSubmit} className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contest PDA
                </label>
                <input
                  type="text"
                  name="contestPda"
                  value={voteForm.contestPda}
                  onChange={handleVoteInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                  placeholder="Enter the contest PDA public key"
                />
                <p className="text-xs text-gray-500 mt-1">
                  The public key of the contest
                </p>
              </div>

              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Content ID
                </label>
                <input
                  type="number"
                  name="contentId"
                  value={voteForm.contentId}
                  onChange={handleVoteInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                  min="0"
                />
                <p className="text-xs text-gray-500 mt-1">
                  The ID of the content you want to vote for (starts from 0)
                </p>
              </div>

              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vote Amount
                </label>
                <input
                  type="number"
                  name="amount"
                  value={voteForm.amount}
                  onChange={handleVoteInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                  min="1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  The amount of votes to cast (1 is typical)
                </p>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="submit"
                disabled={!isWalletConnected || isVoteLoading}
                className={`w-full px-4 py-3 text-white rounded font-medium ${
                  !isWalletConnected || isVoteLoading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 transition-colors'
                }`}
              >
                {isVoteLoading ? 'Voting...' : 'Vote for Content'}
              </button>
            </div>
          </form>

          {/* Vote Error Message */}
          {voteErrorMessage && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {voteErrorMessage}
            </div>
          )}

          {/* Vote Result */}
          {voteResult && (
            <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
              <h3 className="font-semibold mb-2">Vote Cast Successfully!</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <tbody>
                    <tr>
                      <td className="font-medium pr-4 py-1">Content PDA:</td>
                      <td className="font-mono">
                        {voteResult.contentPda.toString()}
                      </td>
                    </tr>
                    <tr>
                      <td className="font-medium pr-4 py-1">
                        Vote Record PDA:
                      </td>
                      <td className="font-mono">
                        {voteResult.voteRecordPda.toString()}
                      </td>
                    </tr>
                    <tr>
                      <td className="font-medium pr-4 py-1">
                        Transaction Signature:
                      </td>
                      <td className="font-mono">
                        <a
                          href={`https://explorer.solana.com/tx/${voteResult.txSignature}?cluster=devnet`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {voteResult.txSignature}
                        </a>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Balance Checking Form - Only shown when activeTab is 'balance' */}
      {activeTab === 'balance' && (
        <div>
          <h2 className="text-xl font-bold mb-4">Check Prize Vault Balance</h2>
          <p className="text-sm text-gray-600 mb-4">
            Check the balance of the prize vault for a contest by providing the
            contest PDA.
            <br />
            This shows you how many prize tokens are currently in the vault.
          </p>

          <form onSubmit={handleBalanceCheckSubmit} className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contest PDA
                </label>
                <input
                  type="text"
                  name="contestPda"
                  value={balanceForm.contestPda}
                  onChange={handleBalanceInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                  placeholder="Enter the contest PDA public key"
                />
                <p className="text-xs text-gray-500 mt-1">
                  The public key of the contest
                </p>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="submit"
                disabled={!isWalletConnected || isBalanceLoading}
                className={`w-full px-4 py-3 text-white rounded font-medium ${
                  !isWalletConnected || isBalanceLoading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-teal-600 hover:bg-teal-700 transition-colors'
                }`}
              >
                {isBalanceLoading ? 'Checking...' : 'Check Balance'}
              </button>
            </div>
          </form>

          {/* Balance Error Message */}
          {balanceErrorMessage && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {balanceErrorMessage}
            </div>
          )}

          {/* Balance Result */}
          {balanceResult && balanceResult.balance && (
            <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
              <h3 className="font-semibold mb-2">
                Prize Vault Balance Information:
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <tbody>
                    <tr>
                      <td className="font-medium pr-4 py-1">Balance:</td>
                      <td className="font-mono">
                        {balanceResult.balance.balance} tokens
                      </td>
                    </tr>
                    <tr>
                      <td className="font-medium pr-4 py-1">Prize Mint:</td>
                      <td className="font-mono">
                        {balanceResult.balance.prizeMint.toString()}
                      </td>
                    </tr>
                    <tr>
                      <td className="font-medium pr-4 py-1">
                        Prize Vault PDA:
                      </td>
                      <td className="font-mono">
                        {balanceResult.balance.prizeVaultPda.toString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Contest Status Checking Form - Only shown when activeTab is 'status' */}
      {activeTab === 'status' && (
        <div>
          <h2 className="text-xl font-bold mb-4">Check Contest Status</h2>
          <p className="text-sm text-gray-600 mb-4">
            Get the current status of a Solana contest by providing its PDA.
            <br />
            This will retrieve information like start time, end time, contest
            interval, and more.
          </p>

          <form onSubmit={handleStatusCheckSubmit} className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contest PDA
                </label>
                <input
                  type="text"
                  name="contestPda"
                  value={statusForm.contestPda}
                  onChange={handleStatusInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                  placeholder="Enter the contest PDA public key"
                />
                <p className="text-xs text-gray-500 mt-1">
                  The public key of the contest you want to check status for
                </p>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="submit"
                disabled={!isWalletConnected || isStatusLoading}
                className={`w-full px-4 py-3 text-white rounded font-medium ${
                  !isWalletConnected || isStatusLoading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-orange-600 hover:bg-orange-700 transition-colors'
                }`}
              >
                {isStatusLoading ? 'Loading Status...' : 'Get Contest Status'}
              </button>
            </div>
          </form>

          {/* Status Error Message */}
          {statusErrorMessage && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {statusErrorMessage}
            </div>
          )}

          {/* Status Result */}
          {statusResult && (
            <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
              <h3 className="font-semibold mb-2">Contest Status</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <tbody>
                    <tr>
                      <td className="font-medium pr-4 py-1">Start Time:</td>
                      <td>
                        {new Date(
                          statusResult.startTime * 1000,
                        ).toLocaleString()}
                      </td>
                    </tr>
                    <tr>
                      <td className="font-medium pr-4 py-1">End Time:</td>
                      <td>
                        {new Date(statusResult.endTime * 1000).toLocaleString()}
                      </td>
                    </tr>
                    <tr>
                      <td className="font-medium pr-4 py-1">
                        Contest Interval:
                      </td>
                      <td>
                        {Math.floor(statusResult.contestInterval / 86400)} days,{' '}
                        {Math.floor(
                          (statusResult.contestInterval % 86400) / 3600,
                        )}{' '}
                        hours,{' '}
                        {Math.floor((statusResult.contestInterval % 3600) / 60)}{' '}
                        minutes
                      </td>
                    </tr>
                    <tr>
                      <td className="font-medium pr-4 py-1">
                        Last Content ID:
                      </td>
                      <td className="font-mono">
                        {statusResult.lastContentId}
                      </td>
                    </tr>
                    <tr>
                      <td className="font-medium pr-4 py-1">Prize Share:</td>
                      <td>{statusResult.prizeShare / 100}%</td>
                    </tr>
                    <tr>
                      <td className="font-medium pr-4 py-1">Contest Token:</td>
                      <td className="font-mono">{statusResult.contestToken}</td>
                    </tr>
                    <tr>
                      <td className="font-medium pr-4 py-1">Status:</td>
                      <td>
                        {Date.now() > statusResult.endTime * 1000 ? (
                          <span className="text-red-600 font-medium">
                            Ended
                          </span>
                        ) : (
                          <span className="text-green-600 font-medium">
                            Active
                          </span>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Contest Score Checking Form - Only shown when activeTab is 'score' */}
      {activeTab === 'score' && (
        <div>
          <h2 className="text-xl font-bold mb-4">Check Contest Score</h2>
          <p className="text-sm text-gray-600 mb-4">
            Get the winner scores and prize distribution for a Solana contest by
            providing its PDA.
            <br />
            This will retrieve information about the total prize, protocol fee,
            and winner details.
          </p>

          <form onSubmit={handleScoreCheckSubmit} className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contest PDA
                </label>
                <input
                  type="text"
                  name="contestPda"
                  value={scoreForm.contestPda}
                  onChange={handleScoreInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                  placeholder="Enter the contest PDA public key"
                />
                <p className="text-xs text-gray-500 mt-1">
                  The public key of the contest you want to check scores for
                </p>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="submit"
                disabled={!isWalletConnected || isScoreLoading}
                className={`w-full px-4 py-3 text-white rounded font-medium ${
                  !isWalletConnected || isScoreLoading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-pink-600 hover:bg-pink-700 transition-colors'
                }`}
              >
                {isScoreLoading ? 'Loading Scores...' : 'Get Contest Scores'}
              </button>
            </div>
          </form>

          {/* Score Error Message */}
          {scoreErrorMessage && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {scoreErrorMessage}
            </div>
          )}

          {/* Score Result */}
          {scoreResult && (
            <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
              <h3 className="font-semibold mb-2">Contest Score</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="p-3 bg-white rounded shadow">
                  <div className="text-xs text-gray-500">Total Prize</div>
                  <div className="text-xl font-bold">
                    {scoreResult.totalPrize} tokens
                  </div>
                </div>
                <div className="p-3 bg-white rounded shadow">
                  <div className="text-xs text-gray-500">Protocol Fee</div>
                  <div className="text-xl font-bold">
                    {scoreResult.protocolFee} tokens
                  </div>
                </div>
                <div className="p-3 bg-white rounded shadow">
                  <div className="text-xs text-gray-500">Contest Status</div>
                  <div className="text-xl font-bold">
                    {scoreResult.isContestEnded ? (
                      <span className="text-red-600">Ended</span>
                    ) : (
                      <span className="text-green-600">Active</span>
                    )}
                  </div>
                </div>
              </div>

              <h4 className="font-semibold mt-4 mb-2">
                {scoreResult.isContestEnded ? 'Winners' : 'Current Leaders'}
              </h4>
              {scoreResult.winners.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full border text-sm">
                    <thead>
                      <tr className="bg-gray-200">
                        <th className="py-2 px-3 text-left">Rank</th>
                        <th className="py-2 px-3 text-left">Content ID</th>
                        <th className="py-2 px-3 text-left">Creator</th>
                        <th className="py-2 px-3 text-left">Content URL</th>
                        <th className="py-2 px-3 text-right">Votes</th>
                        <th className="py-2 px-3 text-right">
                          {scoreResult.isContestEnded
                            ? 'Prize Amount'
                            : 'Projected Prize'}
                        </th>
                        <th className="py-2 px-3 text-center">
                          {scoreResult.isContestEnded ? 'Claimed' : 'Status'}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {scoreResult.winners.map((winner, index) => (
                        <tr
                          key={winner.contentId}
                          className="border-t hover:bg-gray-50"
                        >
                          <td className="py-2 px-3">{index + 1}</td>
                          <td className="py-2 px-3 font-mono">
                            {winner.contentId}
                          </td>
                          <td
                            className="py-2 px-3 font-mono truncate max-w-[100px]"
                            title={winner.creator}
                          >
                            {winner.creator.substring(0, 4)}...
                            {winner.creator.substring(
                              winner.creator.length - 4,
                            )}
                          </td>
                          <td
                            className="py-2 px-3 truncate max-w-[150px]"
                            title={winner.contentUrl}
                          >
                            <a
                              href={winner.contentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              {winner.contentUrl}
                            </a>
                          </td>
                          <td className="py-2 px-3 text-right">
                            {winner.votes}
                          </td>
                          <td className="py-2 px-3 text-right">
                            {winner.prizeAmount} tokens
                          </td>
                          <td className="py-2 px-3 text-center">
                            {scoreResult.isContestEnded ? (
                              winner.isPrizeClaimed ? (
                                <span className="inline-block px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                                  Claimed
                                </span>
                              ) : (
                                <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
                                  Unclaimed
                                </span>
                              )
                            ) : (
                              <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                Pending
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-4 bg-yellow-50 text-yellow-700 rounded">
                  {scoreResult.isContestEnded ? (
                    <p>
                      Contest has ended, but no winners have been determined
                      yet.
                    </p>
                  ) : (
                    <p>
                      No current leaders found in this contest. Winners will be
                      finalized when the contest ends.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SolanaContestInitializer;
