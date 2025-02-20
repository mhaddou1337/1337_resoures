import React, { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CategorySelectProps {
  categories: string[];
  onValueChange?: (value: string) => void;
  className?: string;
  placeholder?: string;
  name?: string;
  required?: boolean;
}

export default function CategorySelect({
  categories,
  onValueChange,
  className = "w-full",
  placeholder = "Select a category",
  name,
  required,
}: CategorySelectProps) {
  const [mounted, setMounted] = useState(false);
  const [selectedValue, setSelectedValue] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleValueChange = (value: string) => {
    setSelectedValue(value);
    onValueChange?.(value);
  };

  if (!mounted) return null;

  return (
    <Select
      onValueChange={handleValueChange}
      name={name}
      required={required}
      value={selectedValue || (required ? categories[0] : '')}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {!required && <SelectItem value="all">All Categories</SelectItem>}
        {categories.map((category) => (
          <SelectItem key={category} value={category}>
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}