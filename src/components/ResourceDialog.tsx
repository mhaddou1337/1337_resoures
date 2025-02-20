"use client"

import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import CategorySelect from "@/components/CategorySelect"
import { getCurrentUser, getUserData } from "@/utils/auth"
import { saveResource } from "@/utils/resources"
import type { Resource } from "@/utils/resources"

interface ResourceDialogProps {
    categories: string[]
    onSuccess: () => void
}

const ResourceDialog = ({ categories, onSuccess }: ResourceDialogProps) => {
    const [open, setOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState("")

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError("")
        setIsSubmitting(true)

        const form = e.target as HTMLFormElement
        const user = getCurrentUser()

        if (!user) {
            setError("No user found")
            setIsSubmitting(false)
            return
        }

        try {
            const userData = await getUserData(user.login)
            if (!userData) {
                setError("Failed to fetch user data")
                setIsSubmitting(false)
                return
            }

            const now = new Date()
            const resource: Resource = {
                id: form.dataset.resourceId || crypto.randomUUID(),
                title: (form.querySelector("#title") as HTMLInputElement).value,
                category: (form.querySelector('[name="category"]') as HTMLSelectElement).value,
                description: (form.querySelector("#description") as HTMLTextAreaElement).value,
                link: (form.querySelector("#link") as HTMLInputElement).value,
                author: {
                    ...userData,
                    "staff?": userData["staff?"] || false,
                    image: {
                        small: user.image?.versions?.small || null,
                    },
                },
                timestamp: now.toISOString(),
                createdAt: form.dataset.createdAt ? new Date(form.dataset.createdAt) : now,
                updatedAt: now,
                status: "published",
                tags: [],
                votes: [],
                voteCount: 0,
                comments: [],
            }

            await saveResource(resource)
            form.reset()
            setOpen(false)
            onSuccess()
        } catch (err) {
            setError("Failed to save resource. Please try again.")
            console.error("Failed to save resource:", err)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="default">Share a Resource</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[625px]">
                <DialogHeader>
                    <DialogTitle>Share a Resource</DialogTitle>
                    <DialogDescription>
                        Share educational content that benefits the community
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                    <div>
                        <label htmlFor="title" className="block text-sm font-semibold mb-2">
                            Title
                        </label>
                        <input
                            type="text"
                            id="title"
                            required
                            minLength={3}
                            maxLength={100}
                            className="w-full rounded-md border p-3 bg-background text-foreground"
                            placeholder="Enter a descriptive title"
                        />
                    </div>
                    <div>
                        <label htmlFor="category" className="block text-sm font-semibold mb-2">
                            Category
                        </label>
                        <CategorySelect
                            client:load
                            categories={categories}
                            name="category"
                            required
                            className="w-full"
                        />
                    </div>
                    <div>
                        <label htmlFor="description" className="block text-sm font-semibold mb-2">
                            Description
                        </label>
                        <textarea
                            id="description"
                            required
                            minLength={10}
                            maxLength={500}
                            rows={4}
                            className="w-full rounded-md border p-3 bg-background text-foreground"
                            placeholder="Provide a detailed description of the resource"
                        />
                    </div>
                    <div>
                        <label htmlFor="link" className="block text-sm font-semibold mb-2">
                            Resource Link
                        </label>
                        <input
                            type="url"
                            id="link"
                            required
                            pattern="^https://.*"
                            className="w-full rounded-md border p-3 bg-background text-foreground"
                            placeholder="https://"
                        />
                    </div>

                    {/* Posting Guidelines */}
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/50 rounded-lg">
                        <h3 className="text-sm font-semibold mb-2">Posting Guidelines</h3>
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
                            <li>Share educational content that benefits the community</li>
                            <li>Properly attribute sources and respect copyright</li>
                            <li>Ensure content is relevant to the selected category</li>
                            <li>Keep discussions constructive and respectful</li>
                        </ul>
                    </div>

                    {error && (
                        <div className="bg-red-100 dark:bg-red-900 p-3 rounded text-red-700 dark:text-red-300">
                            {error}
                        </div>
                    )}

                    <div className="flex gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            className="w-1/4"
                            onClick={() => setOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" className="w-3/4" disabled={isSubmitting}>
                            {isSubmitting ? "Saving..." : "Share Resource"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}

export default ResourceDialog