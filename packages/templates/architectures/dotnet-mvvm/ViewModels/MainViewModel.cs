using System.ComponentModel;
using System.Runtime.CompilerServices;

namespace {{projectName}}.ViewModels;

public class MainViewModel : INotifyPropertyChanged
{
    private string _title = "Welcome to {{projectName}} MVVM";
    private int _count = 0;

    public string Title
    {
        get => _title;
        set => SetField(ref _title, value);
    }

    public int Count
    {
        get => _count;
        set => SetField(ref _count, value);
    }

    public void IncrementCount()
    {
        Count++;
    }

    public event PropertyChangedEventHandler? PropertyChanged;

    protected void OnPropertyChanged([CallerMemberName] string? propertyName = null)
    {
        PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
    }

    protected bool SetField<T>(ref T field, T value, [CallerMemberName] string? propertyName = null)
    {
        if (EqualityComparer<T>.Default.Equals(field, value)) return false;
        field = value;
        OnPropertyChanged(propertyName);
        return true;
    }
}
