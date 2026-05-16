using Microsoft.AspNetCore.Mvc;

namespace SignalRChat.Controllers;

public class HomeController : Controller
{
    public IActionResult Index()
    {
        return View();
    }
}