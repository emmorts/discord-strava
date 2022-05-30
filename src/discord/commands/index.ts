import { CommandBase } from "./command-base";
import { StatsCommand } from "./stats.command";

const commands = [
  new StatsCommand()
];

export function getCommands(): CommandBase[] {  
  return commands;
}

export function getCommandMap(): Map<string, CommandBase> {
  const commands = getCommands();
  const commandMap = new Map<string, CommandBase>();

  for (const command of commands) {
    commandMap.set(command.getName(), command);
  }

  return commandMap;
}