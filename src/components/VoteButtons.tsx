import { useState, useEffect } from 'react';
import { Button } from "./ui/button";

interface VoteButtonsProps {
    resourceId: string;
    initialVotes: number;
    initialPoints?: number;
    onVote: (resourceId: string, value: number) => Promise<void>;
}

export default function VoteButtons({ resourceId, initialVotes, initialPoints = 0, onVote }: VoteButtonsProps) {
    const [votes, setVotes] = useState(initialVotes);
    const [userVote, setUserVote] = useState<number>(0);
    const [points, setPoints] = useState(initialPoints);
    const [wallet, setWallet] = useState<number>(0);

    useEffect(() => {
        // Load initial wallet value
        const loadWallet = async () => {
            try {
                const response = await fetch('/data.json');
                const data = await response.json();
                const username = localStorage.getItem('username');
                const user = data.find((u: any) => u.login === username);
                if (user) {
                    setWallet(parseFloat(user.wallet));
                }
            } catch (error) {
                console.error('Error loading wallet:', error);
            }
        };

        loadWallet();
        // Refresh wallet value every 2 seconds
        const interval = setInterval(loadWallet, 2000);

        return () => clearInterval(interval);
    }, []);

    const updateWallet = async (changeAmount: number) => {
        try {
            const response = await fetch('/data.json');
            const data = await response.json();
            const username = localStorage.getItem('username');
            const userIndex = data.findIndex((u: any) => u.login === username);

            if (userIndex !== -1) {
                // Only process wallet changes for upvotes
                if (changeAmount !== 0) {
                    const currentWallet = parseFloat(data[userIndex].wallet);
                    const newWallet = +(currentWallet + changeAmount).toFixed(1);
                    data[userIndex].wallet = newWallet;
                    setWallet(newWallet); // Update local wallet state immediately

                    // Update data.json
                    await fetch('/data.json', {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(data, null, 2)
                    });

                    // Reload wallet value to ensure sync
                    const verifyResponse = await fetch('/data.json');
                    const verifyData = await verifyResponse.json();
                    const verifyUser = verifyData.find((u: any) => u.login === username);
                    if (verifyUser) {
                        setWallet(verifyUser.wallet);
                    }
                }
            }
        } catch (error) {
            console.error('Error updating wallet:', error);
        }
    };

    // Update votes in data.json
    const updateVotes = async (value: number) => {
        try {
            const response = await fetch('/data.json');
            const data = await response.json();

            // Find the resource and update its votes
            const resourceIndex = data.findIndex((item: any) => item.id === resourceId);
            if (resourceIndex !== -1) {
                data[resourceIndex].votes = (data[resourceIndex].votes || 0) + value;

                // Update data.json
                await fetch('/data.json', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data, null, 2)
                });
            }
        } catch (error) {
            console.error('Error updating votes:', error);
        }
    };

    const handleVote = async (value: number) => {
        const pointChange = value === 1 ? 1 : -1;

        // If clicking the same button, remove the vote
        if (value === userVote) {
            await onVote(resourceId, 0);
            setVotes(votes - value);
            setPoints(points - pointChange);
            setUserVote(0);

            // Update votes in data.json
            await updateVotes(-value);
        } else {
            // If changing vote, remove previous vote and add new one
            await onVote(resourceId, value);
            setVotes(votes - userVote + value);
            setPoints(points - (userVote === 1 ? 1 : userVote === -1 ? -1 : 0) + pointChange);
            setUserVote(value);

            // Update votes in data.json
            if (userVote !== 0) {
                // First remove old vote
                await updateVotes(-userVote);
            }
            // Then add new vote
            await updateVotes(value);
        }
    };

    return (
        <div className="flex items-start gap-1.5 py-1 px-2 rounded-lg bg-muted">
            <Button
                variant="ghost"
                size="sm"
                className={`h-7 w-7 p-0 hover:bg-accent transition-colors duration-200 ${userVote === 1
                    ? 'text-green-500 bg-green-50 dark:bg-gray-800 dark:text-gray-100 hover:bg-accent'
                    : ''
                    }`}
                onClick={() => handleVote(1)}
                title="Upvote"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill={userVote === 1 ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="transition-transform duration-200 hover:scale-110"
                >
                    <path d="m18 15-6-6-6 6" />
                </svg>
            </Button>
            <span className={`text-sm font-semibold tabular-nums pt-0.5 min-w-[1.5rem] text-center ${votes > 0 ? 'text-green-500' :
                votes < 0 ? 'text-red-500' :
                    'text-gray-500'
                }`}>
                {votes}
            </span>
            <Button
                variant="ghost"
                size="sm"
                className={`h-7 w-7 p-0 hover:bg-accent transition-colors duration-200 ${userVote === -1
                    ? 'text-red-500 bg-red-50 dark:bg-gray-800 dark:text-gray-100 hover:bg-accent'
                    : ''
                    }`}
                onClick={() => handleVote(-1)}
                title="Downvote"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill={userVote === -1 ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="transition-transform duration-200 hover:scale-110"
                >
                    <path d="m6 9 6 6 6-6" />
                </svg>
            </Button>
        </div>
    );
}