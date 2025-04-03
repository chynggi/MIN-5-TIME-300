export function UserAvatars() {
  const users = [
    { id: 1, color: "bg-green-200" },
    { id: 2, color: "bg-orange-200" },
    { id: 3, color: "bg-blue-200" },
    { id: 4, color: "bg-gray-200" },
    { id: 5, color: "bg-purple-200" },
  ]

  return (
    <div className="flex justify-between">
      {users.map((user) => (
        <div key={user.id} className="flex flex-col items-center">
          <div className={`h-12 w-12 rounded-full border border-gray-300 ${user.color}`}></div>
          <div className="mt-1 flex items-center text-xs">
            <span className="mr-1">❤️</span>
            <span>Unknown</span>
          </div>
        </div>
      ))}
    </div>
  )
}

