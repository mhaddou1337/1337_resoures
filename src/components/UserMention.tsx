"use client"

import UserHoverCard from "@/components/UserHoverCard"

interface UserMentionProps {
  username?: string;
  name?: string;
  role?: string;
  image?: string;
  isStaff?: boolean;
  usual_full_name?: string;
}

const UserMention = ({
  username = "ATALBAOU",
  name = "Abderrahim Talbaou",
  role = "FullStack Developer",
  image = "https://avatars.githubusercontent.com/u/143417886",
  isStaff = true,
  usual_full_name
}: UserMentionProps) => {
  const url = `https://api.intra.42.fr/v2/users/${username.toLowerCase()}`;

  return (
    <div className="inline-block">
      <UserHoverCard
        username={username}
        name={name}
        role={role}
        image={image}
        isStaff={isStaff}
        usual_full_name={usual_full_name}
      />
    </div>
  );
}

export default UserMention;