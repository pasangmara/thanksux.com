export default function Loading() {
  return (
    <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-7 px-5 py-7 sm:px-8 lg:px-10 lg:py-9" aria-busy="true" aria-label="Loading">
      <div className="skeleton h-9 w-64" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-[118px]" />
        ))}
      </div>
      <div className="skeleton h-[380px]" />
    </div>
  );
}
