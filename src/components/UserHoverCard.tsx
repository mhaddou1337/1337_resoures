"use client"

import { useEffect, useState } from "react"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { Badge } from "@/components/ui/badge"

interface UserHoverCardProps {
  username: string;
  name: string;
  role: string;
  image: string;
  isStaff?: boolean;
  usual_full_name?: string;
  wallet?: number;
}

const UserHoverCard = ({
  username,
  name,
  role,
  image,
  isStaff,
  usual_full_name,
  wallet = 0
}: UserHoverCardProps) => {
  const [currentWallet, setCurrentWallet] = useState(wallet);
  const [isActive, setIsActive] = useState<boolean>(false);
  const url = `https://profile.intra.42.fr/users/${username.toLowerCase()}`;

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch data.json for wallet and upvotes
        const response = await fetch('/data.json');
        const data = await response.json();
        const user = data.find((u: any) => u.login === username.toLowerCase());

        if (user) {
          setCurrentWallet(user.wallet);
          setIsActive(user["active?"] ?? false);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
    // Refresh data every 5 seconds
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [username]); // Update when username changes

  return (
    <span className="inline-flex items-center gap-1">
      <HoverCard openDelay={0} closeDelay={150}>
        <HoverCardTrigger asChild>
          <a href={url} target="_blank" rel="noopener noreferrer" className="inline font-medium text-blue-600 dark:text-blue-400 hover:underline relative z-10">
            @{username.toUpperCase()}
          </a>
        </HoverCardTrigger>
        <HoverCardContent side="top" align="start" sideOffset={5} className="w-80 z-50">
          <div className="flex gap-4">
            <img
              src={image}
              alt={usual_full_name || name}
              className="h-10 w-10 rounded-full"
            />
            <div className="space-y-1.5">
              <h4 className="text-sm font-semibold">{usual_full_name || name}</h4>
              <p className="text-sm text-muted-foreground">{username.toLowerCase()}@student.1337.ma</p>
              <div className="flex items-center gap-2 pt-1">
                <Badge variant="secondary" className={`px-2 py-0.5 text-xs ${isActive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                  {isActive ? 'Active' : 'Inactive'}
                </Badge>
                <Badge variant="outline" className="px-2 py-0.5 text-xs flex items-center gap-1">
                  {Number(currentWallet).toFixed(1)} ₳
                </Badge>
              </div>
            </div>
          </div>
        </HoverCardContent>
      </HoverCard>
    </span>
  )
}

export default UserHoverCard;