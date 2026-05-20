export default function CategoryFilter({ categories, selected, onSelect }) {
  const all = [{ id: null, name: 'All Products' }, ...categories]

  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
      {all.map(cat => (
        <button
          key={cat.id ?? 'all'}
          onClick={() => onSelect(cat.id)}
          className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all border
            ${selected === cat.id
              ? 'bg-primary text-white border-primary shadow-sm'
              : 'bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary'
            }`}
        >
          {cat.icon && <span className="mr-1">{cat.icon}</span>}
          {cat.name}
        </button>
      ))}
    </div>
  )
}
