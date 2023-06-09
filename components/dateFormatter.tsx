import React from "react";

export default function DateFormatter({ date }: { date: Date | string }) {
	const d = new Date(date).toLocaleDateString("fa-IR", {
		day: "numeric",
		month: "long",
		year: "numeric",
	});
	const dateArr = d.split(" ");
	return (
		<span className="flex items-center gap-1 text-sm overflow-hidden">
			<span>{dateArr[0]}</span>
			<span>{dateArr[1]}</span>
			<span>{dateArr[2]}</span>
		</span>
	);
}
