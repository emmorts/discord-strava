import { CommandBase } from "./command-base";
import { HelpCommand } from "./help.command";
import { StatsCommand } from './stats.command';
import { LeaderboardCommand } from "./leaderboard.command";

const commands: { new(): CommandBase }[] = [
  HelpCommand,
  StatsCommand,
  LeaderboardCommand,
];

export function getCommandMap(): Map<string, CommandBase> {
  const commandMap = new Map<string, CommandBase>();

  for (const command of commands) {
    const commandInstance = new command();
    
    commandMap.set(commandInstance.getName(), commandInstance);
  }

  return commandMap;
}