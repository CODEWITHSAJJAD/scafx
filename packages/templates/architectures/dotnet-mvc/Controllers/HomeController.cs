using Microsoft.AspNetCore.Mvc;
using {{projectName}}.Models;

namespace {{projectName}}.Controllers;

public class HomeController : Controller
{
    public IActionResult Index()
    {
        return View();
    }

    public IActionResult Privacy()
    {
        return View();
    }
}
