using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;

namespace SignalRChat.Hubs;

public class ChatHub : Hub
{
    private static readonly ConcurrentDictionary<string, string> _users = new();

    public async Task JoinChat(string username)
    {
        _users[Context.ConnectionId] = username;
        await Clients.All.SendAsync("UserJoined", username);
        await Clients.Caller.SendAsync("SetUsername", username);
        await UpdateUserList();
    }

    public async Task SendMessage(string message)
    {
        if (_users.TryGetValue(Context.ConnectionId, out var username))
        {
            await Clients.All.SendAsync("ReceiveMessage", username, message, DateTime.Now);
        }
    }

    public async Task SendPrivateMessage(string targetUser, string message)
    {
        if (_users.TryGetValue(Context.ConnectionId, out var sender))
        {
            var targetConnectionId = _users.FirstOrDefault(x => x.Value == targetUser).Key;
            if (targetConnectionId != null)
            {
                await Clients.Client(targetConnectionId).SendAsync("ReceivePrivateMessage", sender, message);
                await Clients.Caller.SendAsync("ReceivePrivateMessage", sender, message);
            }
        }
    }

    private async Task UpdateUserList()
    {
        var userList = _users.Values.ToList();
        await Clients.All.SendAsync("UpdateUserList", userList);
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        if (_users.TryRemove(Context.ConnectionId, out var username))
        {
            await Clients.All.SendAsync("UserLeft", username);
            await UpdateUserList();
        }
        await base.OnDisconnectedAsync(exception);
    }
}