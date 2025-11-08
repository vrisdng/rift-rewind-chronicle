import anchorIcon from "@/assets/archetype-icons/anchor.png";
import duelistIcon from "@/assets/archetype-icons/duelist.png";
import gamblerIcon from "@/assets/archetype-icons/gambler.png";
import playmakerIcon from "@/assets/archetype-icons/playmaker.png";
import scalerIcon from "@/assets/archetype-icons/scaler.png";
import snowballerIcon from "@/assets/archetype-icons/snowballer.png";
import strategistIcon from "@/assets/archetype-icons/strategist.png";
import supportiveIcon from "@/assets/archetype-icons/supportive.png";

export const archetypeIcons: Record<string, string> = {
	"The Anchor": anchorIcon,
	"The Duelist": duelistIcon,
	"The Gambler": gamblerIcon,
	"The Playmaker": playmakerIcon,
	"The Scaler": scalerIcon,
	"The Snowballer": snowballerIcon,
	"The Strategist": strategistIcon,
	"The Supportive Core": supportiveIcon,
};

export const getArchetypeIcon = (archetypeName: string): string => {
	return archetypeIcons[archetypeName] || "";
};
